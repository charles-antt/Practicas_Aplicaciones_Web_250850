(function () {
// Funciones de las pantallas: Próximas citas, Configuración y Salidas de almacén.
// Cada bloque solo se activa si sus elementos existen en la página actual.

document.addEventListener("DOMContentLoaded", function () {
    const $ = (id) => document.getElementById(id);

    // ---------- utilidades ----------
    function mostrarBanner(el, texto, tipo) {
        el.textContent = texto;
        el.className = "form-banner is-" + tipo; // is-warning | is-success | is-info
        el.hidden = false;
    }

    function ponerError(campo, mensaje) {
        const contenedor = campo.closest(".field");
        const error = $("error-" + campo.id);
        if (contenedor) contenedor.classList.toggle("is-invalid", mensaje !== "");
        if (error) { error.textContent = mensaje; error.hidden = mensaje === ""; }
        campo.setAttribute("aria-invalid", mensaje !== "" ? "true" : "false");
        return mensaje === "";
    }

    /* =====================================================
       PRÓXIMAS CITAS: filtro por mes / semana
       ===================================================== */
    const radioMes = $("appoimentByMonth");
    if (radioMes) {
        const radioSemana = $("appoimentByWeek");
        const inputMes = $("filtroMes");
        const inputSemana = $("filtroSemana");
        const aviso = $("avisoFiltro");
        const cuerpo = $("tablaCitas");
        const contador = $("contadorCitas");
        const subtitulo = $("citasSubtitulo");
        const vacio = $("citasVacio");
        const filas = [...cuerpo.querySelectorAll("tr")];
        const fmt = { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" };

        // Mes y semana se excluyen: solo está activo el campo del filtro elegido
        function alternarFiltro() {
            const porMes = radioMes.checked;
            inputMes.disabled = !porMes;
            inputSemana.disabled = porMes;
            aviso.hidden = true;
        }

        // "2026-W42" -> [lunes, domingo] en formato AAAA-MM-DD (semana ISO)
        function rangoSemana(valor) {
            const m = /^(\d{4})-W(\d{2})$/.exec(valor);
            if (!m) return null;
            const anio = Number(m[1]), semana = Number(m[2]);
            const cuatroEnero = new Date(Date.UTC(anio, 0, 4));
            const diaSemana = cuatroEnero.getUTCDay() || 7;
            const lunes = new Date(cuatroEnero);
            lunes.setUTCDate(cuatroEnero.getUTCDate() - (diaSemana - 1) + (semana - 1) * 7);
            const domingo = new Date(lunes);
            domingo.setUTCDate(lunes.getUTCDate() + 6);
            return [lunes, domingo];
        }

        const iso = (fecha) => fecha.toISOString().slice(0, 10);

        function filtrar(e) {
            if (e) e.preventDefault();
            let desde, hasta, texto;

            if (radioMes.checked) {
                if (!inputMes.value) { mostrarBanner(aviso, "Selecciona un mes para filtrar las citas.", "warning"); return; }
                const [a, m] = inputMes.value.split("-").map(Number);
                desde = inputMes.value + "-01";
                hasta = inputMes.value + "-31";
                texto = "Datos de ejemplo del mes de " +
                    new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("es-MX", { timeZone: "UTC", month: "long", year: "numeric" });
            } else {
                const rango = rangoSemana(inputSemana.value);
                if (!rango) { mostrarBanner(aviso, "Selecciona una semana para filtrar las citas.", "warning"); return; }
                desde = iso(rango[0]);
                hasta = iso(rango[1]);
                texto = "Datos de ejemplo de la semana del " +
                    rango[0].toLocaleDateString("es-MX", fmt) + " al " + rango[1].toLocaleDateString("es-MX", fmt);
            }

            aviso.hidden = true;
            let visibles = 0;
            filas.forEach(tr => {
                const dentro = tr.dataset.fecha >= desde && tr.dataset.fecha <= hasta;
                tr.hidden = !dentro;
                if (dentro) {
                    visibles++;
                    tr.querySelector(".col-num").textContent = visibles; // se renumera lo visible
                }
            });

            subtitulo.textContent = texto;
            contador.textContent = visibles + (visibles === 1 ? " registro" : " registros");
            vacio.hidden = visibles > 0;
        }

        radioMes.addEventListener("change", alternarFiltro);
        radioSemana.addEventListener("change", alternarFiltro);
        $("formFiltroCitas").addEventListener("submit", filtrar);
        alternarFiltro();
    }

    /* =====================================================
       PRÓXIMAS CITAS: solicitud de una nueva cita
       ===================================================== */
    const formCita = $("formNuevaCita");
    if (formCita) {
        const fecha = $("dateAppoiment");
        const sucursal = $("locations");
        const banner = $("bannerCita");

        // No se puede agendar en el pasado
        const ahora = new Date();
        ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
        fecha.min = ahora.toISOString().slice(0, 16);

        function validarFecha() {
            if (fecha.value === "") return ponerError(fecha, "Este campo es obligatorio.");
            if (fecha.min && fecha.value < fecha.min) return ponerError(fecha, "Elige una fecha y hora que no hayan pasado.");
            return ponerError(fecha, "");
        }
        function validarSucursal() {
            return ponerError(sucursal, sucursal.value.trim() === "" ? "Este campo es obligatorio." : "");
        }

        fecha.addEventListener("input", () => { if (fecha.closest(".field").classList.contains("is-invalid")) validarFecha(); });
        sucursal.addEventListener("input", () => { if (sucursal.closest(".field").classList.contains("is-invalid")) validarSucursal(); });

        formCita.addEventListener("submit", function (e) {
            e.preventDefault();
            const okFecha = validarFecha();
            const okSucursal = validarSucursal();
            if (!okFecha || !okSucursal) {
                mostrarBanner(banner, "Completa los campos obligatorios antes de continuar.", "warning");
                (okFecha ? sucursal : fecha).focus();
                return;
            }
            mostrarBanner(banner, "¡Solicitud revisada! Envío simulado: los datos no se almacenan.", "success");
        });

        formCita.addEventListener("reset", () => {
            banner.hidden = true;
            setTimeout(() => { ponerError(fecha, ""); ponerError(sucursal, ""); }, 0);
        });
    }

    /* =====================================================
       CONFIGURACIÓN: interfaz y cuenta
       ===================================================== */
    const volumen = $("soundsVolume");
    if (volumen) {
        // Colores: se muestra el valor elegido (sin alterar todavía la interfaz)
        ["fontColor", "backgroundColor"].forEach(id => {
            const input = $(id), valor = $(id + "Valor");
            input.addEventListener("input", () => { valor.textContent = input.value; });
        });

        // Volumen y botón de silencio
        const salida = $("volumenValor");
        const botonSilencio = $("muteSounds");
        let ultimoVolumen = Number(volumen.value) || 80;

        function actualizarVolumen() {
            salida.textContent = volumen.value + "%";
            botonSilencio.textContent = Number(volumen.value) === 0 ? "Activar sonidos" : "Silenciar sonidos";
            if (Number(volumen.value) > 0) ultimoVolumen = Number(volumen.value);
        }
        volumen.addEventListener("input", actualizarVolumen);
        botonSilencio.addEventListener("click", function () {
            volumen.value = Number(volumen.value) === 0 ? ultimoVolumen : 0;
            actualizarVolumen();
        });
        actualizarVolumen();

        // Foto de perfil: reemplaza las iniciales por la imagen elegida
        const foto = $("userPhoto");
        const avatar = $("avatarPerfil");
        let urlFoto = null;
        foto.addEventListener("change", function () {
            const archivo = foto.files[0];
            if (urlFoto) { URL.revokeObjectURL(urlFoto); urlFoto = null; }
            avatar.textContent = "MG";
            ponerError(foto, "");
            if (!archivo) return;
            if (!archivo.type.startsWith("image/")) {
                ponerError(foto, "El archivo seleccionado no es una imagen.");
                foto.value = "";
                return;
            }
            urlFoto = URL.createObjectURL(archivo);
            avatar.textContent = "";
            const img = document.createElement("img");
            img.src = urlFoto;
            img.alt = "Foto de perfil";
            avatar.appendChild(img);
        });
    }

    /* =====================================================
       CONFIGURACIÓN: datos fiscales (facturación opcional)
       ===================================================== */
    const formFiscal = $("formFiscal");
    if (formFiscal) {
        const quiere = $("quiereFacturacion");
        const panel = $("panelFacturacion");
        const campos = [...panel.querySelectorAll("input, select")];
        const rfc = $("rfc");
        const cpFiscal = $("cpFiscal");
        const constancia = $("fiscalSituation");
        const banner = $("bannerFiscal");
        const RFC_VALIDO = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

        // Devuelve true si el campo es válido (y muestra u oculta su aviso)
        function validar(el) {
            if (el.disabled) return ponerError(el, "");
            if (el === rfc) {
                if (rfc.value.trim() === "") return ponerError(rfc, "Este campo es obligatorio.");
                return ponerError(rfc, RFC_VALIDO.test(rfc.value) ? "" : "Ingresa un RFC válido (12 o 13 caracteres, ej. ABCD010203XYZ).");
            }
            if (el === cpFiscal) {
                if (cpFiscal.value === "") return ponerError(cpFiscal, ""); // opcional
                return ponerError(cpFiscal, /^\d{5}$/.test(cpFiscal.value) ? "" : "El código postal debe tener 5 dígitos.");
            }
            if (el === constancia) {
                const archivo = constancia.files[0];
                return ponerError(constancia, archivo && archivo.type !== "application/pdf" ? "Selecciona un archivo en formato PDF." : "");
            }
            return true;
        }

        // Los campos solo se activan si se marca la casilla
        function sincronizar(enfocar) {
            const activo = quiere.checked;
            panel.hidden = !activo;
            campos.forEach(el => { el.disabled = !activo; });
            if (!activo) campos.forEach(validar); // limpia avisos de error
            else if (enfocar) rfc.focus();
        }
        quiere.addEventListener("change", () => { banner.hidden = true; sincronizar(true); });

        // RFC: mayúsculas y solo letras, números, & y Ñ (máximo 13)
        rfc.addEventListener("input", function () {
            rfc.value = rfc.value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, "").slice(0, 13);
            if (rfc.closest(".field").classList.contains("is-invalid")) validar(rfc);
        });

        // Código postal fiscal: solo 5 dígitos
        cpFiscal.addEventListener("input", function () {
            cpFiscal.value = cpFiscal.value.replace(/\D/g, "").slice(0, 5);
            if (cpFiscal.closest(".field").classList.contains("is-invalid")) validar(cpFiscal);
        });

        // Constancia: solo PDF (si no lo es, se descarta el archivo y queda el aviso)
        constancia.addEventListener("change", function () {
            if (!validar(constancia)) constancia.value = "";
        });

        // Al salir de un campo con contenido se revisa su formato
        [rfc, cpFiscal].forEach(el => el.addEventListener("blur", () => {
            if (el.value !== "" || el.closest(".field").classList.contains("is-invalid")) validar(el);
        }));

        // Guardar (simulado)
        formFiscal.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!quiere.checked) {
                mostrarBanner(banner, "No hay datos de facturación por guardar. Marca la casilla si deseas proporcionarlos.", "info");
                return;
            }
            let primero = null;
            campos.forEach(el => { if (!validar(el) && !primero) primero = el; });
            if (primero) {
                mostrarBanner(banner, "Completa los campos obligatorios antes de continuar.", "warning");
                primero.focus();
                return;
            }
            mostrarBanner(banner, "¡Datos fiscales revisados! Envío simulado: los datos no se almacenan.", "success");
        });

        // "Limpiar": vuelve a apagar la facturación y quita avisos
        formFiscal.addEventListener("reset", function () {
            banner.hidden = true;
            setTimeout(() => sincronizar(false), 0);
        });

        sincronizar(false);
    }

    /* =====================================================
       SALIDAS DE ALMACÉN: solicitud de herramientas y refacciones
       ===================================================== */
    const formSalida = $("formSalida");
    if (formSalida) {
        const catalogo = {
            refaccion: ["Banda de distribución", "Filtro de aceite", "Bujías", "Balatas delanteras", "Amortiguador delantero"],
            herramienta: ["Llave combinada", "Llave dinamométrica", "Extractor de poleas", "Llave Torx"]
        };
        const select = $("recursoPieza");
        const cantidad = $("recursoCantidad");
        const boton = $("btnSolicitarRecurso");
        const banner = $("bannerAlmacen");
        const radios = [...formSalida.querySelectorAll('input[name="recursoCategoria"]')];
        const categoria = () => radios.find(r => r.checked).value;

        // La lista de piezas cambia según la categoría elegida
        function cargarPiezas() {
            const cat = categoria();
            select.innerHTML = "";
            catalogo[cat].forEach(nombre => {
                const op = document.createElement("option");
                op.value = op.textContent = nombre;
                select.appendChild(op);
            });
            boton.textContent = cat === "refaccion" ? "Solicitar refacción" : "Solicitar herramienta";
            banner.hidden = true;
        }
        radios.forEach(r => r.addEventListener("change", cargarPiezas));

        // La cantidad siempre queda entre 1 y 99
        cantidad.addEventListener("change", function () {
            const n = Math.round(Number(cantidad.value));
            cantidad.value = Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 1;
        });

        // El botón es solo visual, como indica la nota de la pantalla
        formSalida.addEventListener("submit", function (e) {
            e.preventDefault();
            mostrarBanner(banner,
                "Acción de demostración: se solicitó " + cantidad.value + " × " + select.value +
                ", pero todavía no se agregan elementos a la tabla.", "info");
        });

        cargarPiezas();
    }
});

})();