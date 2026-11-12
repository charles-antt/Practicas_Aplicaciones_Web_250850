(function () {
// Todo el archivo va dentro de una función para que sus variables no choquen con las de otros .js del proyecto

// Practica 01: primer mensaje en la consola del navegador
console.log("Hola desde JavaScript");

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formRegistro");
    if (!form) return;

    const $ = (id) => document.getElementById(id);
    const MSG_OBLIGATORIO = "Este campo es obligatorio.";
    const MSG_BANNER = "Completa los campos obligatorios antes de continuar.";

    /* =====================================================
       Practica 02: calcular y mostrar la mayoría de edad
       ===================================================== */
    const fechaNacimiento = $("fechaNacimiento");
    const resultadoEdad = $("resultadoEdad");
    const TEXTO_EDAD_INICIAL = "Selecciona una fecha para calcular tu edad.";

    function limpiarEdad() {
        resultadoEdad.classList.remove("edad-estado--mayor", "edad-estado--menor", "edad-estado--error");
        resultadoEdad.textContent = TEXTO_EDAD_INICIAL;
    }

    fechaNacimiento.addEventListener("change", function () {
        limpiarEdad();
        if (fechaNacimiento.value === "") return; // sin fecha: estado inicial

        // Un input date devuelve AAAA-MM-DD
        const [anio, mes, dia] = fechaNacimiento.value.split("-").map(Number);
        const nacimiento = new Date(anio, mes - 1, dia); // Meses: 0 = enero
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // se comparan fechas, no horas

        if (nacimiento > hoy) {
            resultadoEdad.textContent = "Error: no se puede calcular la edad con los datos elegidos. La fecha es futura.";
            resultadoEdad.classList.add("edad-estado--error");
            return;
        }

        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
        if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        const textoEdad = `Tienes ${edad} ${edad === 1 ? "año" : "años"}.`;
        if (edad >= 18) {
            resultadoEdad.textContent = `Eres mayor de edad. ${textoEdad}`;
            resultadoEdad.classList.add("edad-estado--mayor");   // verde
        } else {
            resultadoEdad.textContent = `Eres menor de edad. ${textoEdad}`;
            resultadoEdad.classList.add("edad-estado--menor");   // rojo
        }
    });

    /* =====================================================
       Vista previa del QR de WhatsApp
       ===================================================== */
    const qrInput = $("whatsAppQR");
    const qrCheck = $("socialNetworks3");
    const qrVacio = $("qrEmpty");
    const qrImagen = $("qrImage");
    const qrError = $("qrError");
    const qrNombre = $("qrFileName");
    const qrQuitar = $("qrRemove");
    const TEXTO_QR_INICIAL = "Solo vista previa local; no se envía al servidor.";
    let qrUrl = null;

    function limpiarQR() {
        if (qrUrl) { URL.revokeObjectURL(qrUrl); qrUrl = null; }
        qrImagen.removeAttribute("src");
        qrImagen.hidden = true;
        qrVacio.hidden = false;
        qrNombre.textContent = TEXTO_QR_INICIAL;
        qrQuitar.hidden = true;
        qrError.hidden = true;
        qrError.textContent = "";
    }

    qrInput.addEventListener("change", function () {
        const archivo = qrInput.files[0];
        limpiarQR();
        if (!archivo) return;

        if (!archivo.type.startsWith("image/")) {
            qrError.textContent = "El archivo seleccionado no es una imagen. Elige un PNG, JPG o WEBP.";
            qrError.hidden = false;
            qrVacio.hidden = true;
            qrInput.value = "";
            return;
        }

        qrUrl = URL.createObjectURL(archivo);
        qrImagen.src = qrUrl;
        qrImagen.hidden = false;
        qrVacio.hidden = true;
        qrNombre.textContent = "Archivo: " + archivo.name;
        qrQuitar.hidden = false;
        qrCheck.checked = true; // al adjuntar el QR se marca WhatsApp automáticamente
    });

    qrQuitar.addEventListener("click", function () {
        qrInput.value = "";
        limpiarQR();
    });

    /* =====================================================
       Catálogo de domicilios (domicilios.js): sugerencias y autocompletado
       La captura manual sigue permitida; el catálogo solo ayuda.
       ===================================================== */
    let actualizarListasDomicilio = function () {};

    (function iniciarDomicilios() {
        const catalogo = window.MECAGEST_DOMICILIOS;
        if (!catalogo) return; // si domicilios.js no cargó, los campos funcionan como texto libre

        const pais = $("pais"), estado = $("estado"), ciudad = $("ciudad"), cp = $("codigoPostal");
        const ejemplos = catalogo.ejemplosMexico;
        const auto = { estado: "", ciudad: "", cp: "" }; // últimos valores puestos automáticamente

        // Compara sin importar mayúsculas ni acentos
        const norm = (t) => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const esMexico = () => ["", "mexico"].includes(norm(pais.value));

        function llenarLista(id, valores) {
            const lista = $(id);
            lista.innerHTML = "";
            [...new Set(valores)].forEach(v => {
                const op = document.createElement("option");
                op.value = v;
                lista.appendChild(op);
            });
        }

        // Pone un valor automático solo si el campo está vacío o tenía otro valor automático
        function poner(campo, clave, valor) {
            if (campo.value.trim() === "" || campo.value === auto[clave]) {
                campo.value = valor;
                auto[clave] = valor;
            }
        }

        actualizarListasDomicilio = function () {
            llenarLista("listaPaises", catalogo.paises);
            llenarLista("listaEstados", esMexico() ? catalogo.estadosMexico : []);

            let lista = esMexico() ? ejemplos : [];
            if (estado.value.trim()) lista = lista.filter(e => norm(e.estado) === norm(estado.value));
            llenarLista("listaCiudades", lista.map(e => e.ciudad));

            if (ciudad.value.trim()) lista = lista.filter(e => norm(e.ciudad) === norm(ciudad.value));
            llenarLista("listaCP", lista.map(e => e.cp));
        };

        pais.addEventListener("input", actualizarListasDomicilio);
        estado.addEventListener("input", actualizarListasDomicilio);

        // Al elegir una ciudad conocida se completan estado y código postal
        ciudad.addEventListener("change", function () {
            if (esMexico() || pais.value.trim() === "") {
                const coincidencias = ejemplos.filter(e => norm(e.ciudad) === norm(ciudad.value));
                const dato = coincidencias.find(e => estado.value.trim() === "" || norm(e.estado) === norm(estado.value)) || null;
                if (dato) {
                    ciudad.value = dato.ciudad; // se escribe con el nombre oficial del catálogo
                    poner(pais, "pais", "México");
                    poner(estado, "estado", dato.estado);
                    poner(cp, "cp", dato.cp);
                }
            }
            actualizarListasDomicilio();
        });

        // Solo dígitos en el código postal; con 5 dígitos conocidos se completan los demás datos
        cp.addEventListener("input", function () {
            cp.value = cp.value.replace(/\D/g, "");
            if (cp.value.length === 5) {
                const dato = ejemplos.find(e => e.cp === cp.value);
                if (dato) {
                    poner(pais, "pais", "México");
                    poner(estado, "estado", dato.estado);
                    poner(ciudad, "ciudad", dato.ciudad);
                }
            }
            actualizarListasDomicilio();
        });

        actualizarListasDomicilio();
    })();

    /* =====================================================
       Teléfono: solo se permiten números
       ===================================================== */
    (function soloNumerosTelefono() {
        const telefono = $("telefono");
        const errorTel = $("error-telefono");
        const MSG_NUMEROS = "Solo se permiten números.";
        let temporizador;

        telefono.addEventListener("input", function () {
            const soloDigitos = telefono.value.replace(/\D/g, ""); // quita letras, espacios, guiones, paréntesis, etc.
            const limpio = soloDigitos.slice(0, 15);                // máximo 15 dígitos (estándar internacional)
            if (limpio === telefono.value) return;

            const huboCaracteresInvalidos = /\D/.test(telefono.value); // había letras, espacios o símbolos
            telefono.value = limpio; // también limpia lo que se pegue desde el portapapeles
            if (!huboCaracteresInvalidos) return;
            // setTimeout 0: el aviso se muestra después de que el validador general revise el campo
            setTimeout(function () {
                telefono.closest(".field").classList.add("is-invalid");
                errorTel.textContent = MSG_NUMEROS;
                errorTel.hidden = false;
            }, 0);

            clearTimeout(temporizador);
            temporizador = setTimeout(function () {
                if (errorTel.textContent === MSG_NUMEROS) {
                    telefono.closest(".field").classList.remove("is-invalid");
                    errorTel.hidden = true;
                    errorTel.textContent = "";
                }
            }, 1800);
        });
    })();

    /* =====================================================
       Wizard por pasos con validación
       ===================================================== */
    const TOTAL = 4;
    const tarjeta = $("registroWizard");
    const paneles = [...form.querySelectorAll(".wizard-panel")];
    const items = [...document.querySelectorAll(".stepper-item")];
    const relleno = $("wizardProgress");
    const banner = $("bannerFormulario");
    const btnAnterior = $("btnAnterior");
    const btnSiguienteTexto = $("btnSiguienteTexto");
    const btnSiguienteIcono = $("btnSiguienteIcono");
    let pasoActual = 1;

    function mostrarBanner(texto, tipo) {
        banner.textContent = texto;
        banner.className = "form-banner is-" + tipo; // is-warning | is-success
        banner.hidden = false;
    }

    function ocultarBanner() {
        banner.hidden = true;
        banner.textContent = "";
    }

    // --- Reglas de la contraseña: 8+ caracteres, mayúscula, número y signo especial ---
    const MSG_CLAVE = "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un signo especial.";

    function reglasClave(valor) {
        return {
            longitud: valor.length >= 8,
            mayuscula: /[A-ZÁÉÍÓÚÑ]/.test(valor),
            numero: /\d/.test(valor),
            especial: /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(valor)
        };
    }

    const contrasena = $("contrasena");
    const confirmarContrasena = $("confirmarContrasena");
    const listaReglas = $("reglasContrasena");

    // Marca con ✓ cada requisito que la contraseña ya cumple
    function actualizarReglasClave() {
        const estado = reglasClave(contrasena.value);
        listaReglas.querySelectorAll("li").forEach(li => {
            li.classList.toggle("is-ok", estado[li.dataset.regla]);
        });
    }

    contrasena.addEventListener("input", function () {
        actualizarReglasClave();
        // Si ya se escribió la confirmación, se vuelve a comparar con la nueva contraseña
        if (confirmarContrasena.value !== "") validarCampo(confirmarContrasena);
    });

    // La confirmación se compara mientras se escribe
    confirmarContrasena.addEventListener("input", function () {
        if (confirmarContrasena.value !== "") validarCampo(confirmarContrasena);
    });

    // --- Validación de campos ---
    function mensajeDe(el) {
        if (el.type === "checkbox") {
            return el.required && !el.checked ? (el.dataset.mensaje || MSG_OBLIGATORIO) : "";
        }
        const valor = el.value.trim();
        if (valor === "") return el.required ? MSG_OBLIGATORIO : "";
        if (el.id === "contrasena") {
            return Object.values(reglasClave(el.value)).every(Boolean) ? "" : MSG_CLAVE;
        }
        if (el.id === "confirmarContrasena") {
            return el.value === $("contrasena").value ? "" : "Las contraseñas no coinciden.";
        }
        if (el.validity.typeMismatch) {
            return el.type === "email" ? "Ingresa un correo electrónico válido."
                                       : "Ingresa una URL válida (https://...).";
        }
        if (el.minLength > 0 && valor.length < el.minLength) {
            return `Utiliza al menos ${el.minLength} caracteres.`;
        }
        return "";
    }

    // Muestra u oculta el error de un campo. Devuelve true si el campo es válido.
    function validarCampo(el) {
        const contenedor = el.closest(".field");
        if (!contenedor) return true; // casillas sueltas (redes sociales) no se validan
        if (el.disabled) {            // campos apagados (p. ej. facturación sin activar) no se validan
            const errorOff = $("error-" + el.id);
            contenedor.classList.remove("is-invalid");
            el.removeAttribute("aria-invalid");
            if (errorOff) { errorOff.hidden = true; errorOff.textContent = ""; }
            return true;
        }
        const mensaje = mensajeDe(el);
        const errorEl = $("error-" + el.id);
        contenedor.classList.toggle("is-invalid", mensaje !== "");
        el.setAttribute("aria-invalid", mensaje !== "" ? "true" : "false");
        if (errorEl) {
            errorEl.textContent = mensaje;
            errorEl.hidden = mensaje === "";
        }
        return mensaje === "";
    }

    function camposDe(n) {
        return [...paneles[n - 1].querySelectorAll(
            "input:not([type='file']):not([type='hidden']), select, textarea"
        )];
    }

    // Valida todo un paso. Devuelve el primer campo inválido (o null si todo está bien).
    function validarPaso(n) {
        let primero = null;
        camposDe(n).forEach(el => {
            if (!validarCampo(el) && !primero) primero = el;
        });
        return primero;
    }

    // Mientras se escribe solo se quita el error cuando el valor ya es correcto
    function reevaluar(e) {
        const contenedor = e.target.closest(".field");
        if (contenedor && contenedor.classList.contains("is-invalid")) validarCampo(e.target);
    }
    form.addEventListener("input", reevaluar);
    form.addEventListener("change", reevaluar);

    // Al salir de una casilla se revisa si tiene contenido (p. ej. un correo mal escrito)
    form.addEventListener("focusout", function (e) {
        const el = e.target;
        const contenedor = el.closest && el.closest(".field");
        if (!contenedor || el.type === "checkbox") return;
        if (el.value.trim() !== "" || contenedor.classList.contains("is-invalid")) validarCampo(el);
    });

    // --- Redes sociales: el campo solo se habilita si su casilla está marcada ---
    const redes = [
        { check: $("socialNetworks1"), campo: $("urlFacebook") },
        { check: $("socialNetworks2"), campo: $("urlLinkedIn") },
        { check: $("socialNetworks3"), campo: qrInput }          // WhatsApp: imagen del QR
    ];

    function sincronizarRed(red, enfocar) {
        const { check, campo } = red;
        campo.disabled = !check.checked;

        if (!check.checked) {
            // Al desmarcar se borra lo capturado y se quita cualquier error
            if (campo === qrInput) {
                qrInput.value = "";
                limpiarQR();
            } else {
                campo.value = "";
                validarCampo(campo);
            }
        } else if (enfocar && campo !== qrInput) {
            campo.focus();
        }
    }

    redes.forEach(red => red.check.addEventListener("change", () => sincronizarRed(red, true)));
    const sincronizarRedes = () => redes.forEach(red => sincronizarRed(red, false));

    // --- Navegación ---
    function mostrarPaso(n, desplazar = true) {
        pasoActual = n;

        paneles.forEach((p, i) => { p.hidden = i !== n - 1; });

        items.forEach((li, i) => {
            const num = i + 1;
            li.classList.toggle("is-active", num === n);
            li.classList.toggle("is-done", num < n);
            li.querySelector(".step-icon").textContent = num < n ? "check" : li.dataset.icon;
            const btn = li.querySelector("button");
            if (num === n) btn.setAttribute("aria-current", "step");
            else btn.removeAttribute("aria-current");
        });

        relleno.style.width = ((n - 1) / (TOTAL - 1)) * 100 + "%";

        btnAnterior.disabled = n === 1;
        const ultimo = n === TOTAL;
        btnSiguienteTexto.textContent = ultimo ? "Enviar solicitud" : "Siguiente";
        btnSiguienteIcono.textContent = ultimo ? "check" : "arrow_forward";

        // El aviso siempre aparece debajo del encabezado del paso visible
        ocultarBanner();
        paneles[n - 1].querySelector(".panel-head").after(banner);

        if (desplazar) tarjeta.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Retroceder es libre; avanzar exige que los pasos anteriores sean válidos
    function irAPaso(destino) {
        if (destino <= pasoActual) { mostrarPaso(destino); return; }
        for (let n = pasoActual; n < destino; n++) {
            const invalido = validarPaso(n);
            if (invalido) {
                if (n !== pasoActual) mostrarPaso(n);
                mostrarBanner(MSG_BANNER, "warning");
                invalido.focus();
                return;
            }
        }
        mostrarPaso(destino);
    }

    btnAnterior.addEventListener("click", () => mostrarPaso(pasoActual - 1));
    items.forEach(li => li.addEventListener("click", () => irAPaso(Number(li.dataset.step))));

    // "Siguiente" y la tecla Enter pasan por aquí; en el último paso se "envía"
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (pasoActual < TOTAL) {
            irAPaso(pasoActual + 1);
            return;
        }

        // Último paso: se revisan todos los pasos antes de dar por buena la solicitud
        for (let n = 1; n <= TOTAL; n++) {
            const invalido = validarPaso(n);
            if (invalido) {
                if (n !== pasoActual) mostrarPaso(n);
                mostrarBanner(MSG_BANNER, "warning");
                invalido.focus();
                return;
            }
        }
        mostrarBanner("¡Registro revisado! Envío simulado: los datos no se almacenan.", "success");
        banner.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // "Limpiar": borra todo el formulario y regresa al paso 1
    form.addEventListener("reset", function () {
        setTimeout(function () {
            form.querySelectorAll(".field.is-invalid").forEach(c => c.classList.remove("is-invalid"));
            form.querySelectorAll(".field-error").forEach(p => { p.hidden = true; p.textContent = ""; });
            form.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
            limpiarEdad();
            limpiarQR();
            sincronizarRedes();
            actualizarReglasClave();
            actualizarListasDomicilio();
            mostrarPaso(1);
        }, 0); // después de que el navegador vacíe los campos
    });

    // Estado inicial
    limpiarEdad();
    limpiarQR();
    sincronizarRedes();
    actualizarReglasClave();
    mostrarPaso(1, false);
});

})();