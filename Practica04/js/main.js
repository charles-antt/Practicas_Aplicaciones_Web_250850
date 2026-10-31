(function () {
// Todo el archivo va dentro de una función para que sus variables no choquen con las de otros .js del proyecto
 
// Practica 01: primer mensaje en la consola del navegador 
console.log("Hola desde JavaScript");
 
// Practica 02: Calcular y mostrar la mayoría de edad sin enviar el formulario.
const fechaNacimiento = document.getElementById("fechaNacimiento");
const resultadoEdad = document.getElementById("resultadoEdad");
 
// Se ejecuta al seleccionar o modificar una fecha 
fechaNacimiento.addEventListener("change", function() {
    // Limpiamos los colores y estados de la validación anterior  
    resultadoEdad.classList.remove(
        "edad-estado--mayor",
        "edad-estado--menor",
        "edad-estado--error"
    );
    resultadoEdad.style.color = ""; // Limpia el color aplicado previamente
 
    // Si el usuario borra la fecha, se regresa al estado inicial 
    if (fechaNacimiento.value === "") {
        resultadoEdad.textContent = "Selecciona una fecha para calcular tu edad"; 
        resultadoEdad.style.color = "";
        return;
    }
 
    // Un input devuelve su valor con formato AAAA-MM-DD
    const [anio, mes, dia] = fechaNacimiento.value.split("-").map(Number);
    const nacimiento = new Date(anio, mes - 1, dia); // Meses: 0 = enero
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Comparar fechas, no horas
 
    // No es posible calcular una edad con una fecha futura (FECHA ERRÓNEA -> ROJO)
    if (nacimiento > hoy) {
        resultadoEdad.textContent = "Error: no se puede calcular la edad con los datos elegidos. La fecha es futura.";
        resultadoEdad.classList.add("edad-estado--error");
        resultadoEdad.style.color = "red";
        return;
    }
 
    // Cálculo de la edad exacta
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
 
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
 
    // Evaluación de la mayoría de edad (18 años)
    if (edad >= 18) {
        resultadoEdad.textContent = `Tienes ${edad} años. Eres mayor de edad.`;
        resultadoEdad.classList.add("edad-estado--mayor");
        resultadoEdad.style.color = "green"; // MAYOR DE EDAD -> VERDE
    } else {
        resultadoEdad.textContent = `Tienes ${edad} años. Eres menor de edad.`;
        resultadoEdad.classList.add("edad-estado--menor");
        resultadoEdad.style.color = "red"; // MENOR DE EDAD -> ROJO
    }
});
 
// Wizard Stepper: cada círculo se llena según los campos completados de su apartado
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form.dashboard-grid");
    const wizardFill = document.getElementById("wizardProgress");
    const pasos = document.querySelectorAll(".wizard-step");
    if (!form || !wizardFill || pasos.length === 0) return;
 
    const $ = (id) => document.getElementById(id);
    const terminos = form.querySelector('.actions-card input[type="checkbox"]');
 
    // Campos que cuentan para considerar "lleno" cada apartado (en el orden de los pasos)
    // Cada función devuelve [campos llenos, campos totales]
    const lleno = (el) => !!el && el.value.trim() !== "" && el.checkValidity();
    const contar = (ids) => [ids.filter(id => lleno($(id))).length, ids.length];
 
    const reglas = [
        // 1. Datos Personales
        () => contar(["nombre", "apPaterno", "fechaNacimiento"]),
        // 2. Datos de Acceso (la confirmación debe coincidir con la contraseña)
        () => {
            const ok = ["usuario", "contrasena"].filter(id => lleno($(id))).length;
            const coincide = lleno($("confirmarContrasena")) &&
                $("confirmarContrasena").value === $("contrasena").value;
            return [ok + (coincide ? 1 : 0), 3];
        },
        // 3. Contacto (correo y teléfono; el horario y las redes son opcionales)
        () => contar(["correo", "telefono"]),
        // 4. Ubicación
        () => contar(["direccion", "pais", "estado", "ciudad", "codigoPostal"]),
        // 5. Confirmación: aceptar términos
        () => [terminos && terminos.checked ? 1 : 0, 1]
    ];
 
    // Preparar los círculos (número + check) y la etiqueta de estado de cada paso
    pasos.forEach((paso, i) => {
        paso.classList.remove("active");
        const circulo = paso.querySelector(".step-circle");
        circulo.innerHTML =
            `<span class="step-num">${i + 1}</span>` +
            `<span class="material-symbols-outlined step-check">check</span>`;
        const estado = document.createElement("span");
        estado.className = "step-status";
        paso.appendChild(estado);
    });
 
    function actualizarWizard() {
        const fracciones = [];
 
        pasos.forEach((paso, i) => {
            const [llenos, total] = reglas[i]();
            const fraccion = total === 0 ? 0 : llenos / total;
            fracciones.push(fraccion);
 
            const completo = llenos === total;
            const parcial = llenos > 0 && !completo;
 
            paso.classList.toggle("is-complete", completo);
            paso.classList.toggle("is-partial", parcial);
            paso.querySelector(".step-circle").style.setProperty("--fill", Math.round(fraccion * 100));
 
            paso.querySelector(".step-status").textContent =
                completo ? "Completo" :
                parcial  ? `En progreso (${llenos}/${total})` :
                           "Pendiente";
        });
 
        // La línea avanza paso a paso: pasos completos seguidos + avance parcial del siguiente
        let k = 0;
        while (k < pasos.length && fracciones[k] === 1) k++;
        const posicion = Math.max(0, (k - 1) + (k < pasos.length ? fracciones[k] : 0));
        wizardFill.style.width = (posicion / (pasos.length - 1)) * 100 + "%";
    }
 
    form.addEventListener("input", actualizarWizard);
    form.addEventListener("change", actualizarWizard);
    form.addEventListener("reset", () => setTimeout(actualizarWizard, 0)); // tras limpiar el formulario
 
    actualizarWizard();
});
 
// Practica: Control de la barra de progreso dinamica conforme se llena el formulario
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form.dashboard-grid");
    const progressBar = document.getElementById("progressBar");
    const stepperText = document.getElementById("stepper-text");
 
    if (!form || !progressBar || !stepperText) return;
 
    // Seleccionamos los inputs activos en el primer formulario
    const inputs = form.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='reset']), select, textarea");
 
    function actualizarProgreso() {
        let llenados = 0;
        let total = inputs.length;
 
        inputs.forEach(input => {
            if (input.type === "checkbox" || input.type === "radio") {
                if (input.checked) llenados++;
            } else if (input.value.trim() !== "") {
                llenados++;
            }
        });
 
        const porcentaje = Math.round((llenados / total) * 100);
        progressBar.style.width = porcentaje + "%";
        stepperText.textContent = `Progreso del formulario: ${porcentaje}% (${llenados} de ${total} campos completados)`;
    }
 
    // Escuchar eventos en cada campo del formulario
    inputs.forEach(input => {
        input.addEventListener("input", actualizarProgreso);
        input.addEventListener("change", actualizarProgreso);
    });
 
    // Inicializar cálculo al cargar
    actualizarProgreso();
});
 
 
// Avisos de validación: "Por favor, llena este apartado" debajo de cada casilla
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form.dashboard-grid");
    if (!form) return;
 
    form.noValidate = true; // se desactiva el globo nativo del navegador; usamos nuestros avisos
 
    const MENSAJE = "Por favor, llena este apartado";
 
    // Casillas que deben llenarse (las mismas que usa la barra wizard).
    // Para exigir otra, agrega su id a esta lista.
    const idsObligatorios = [
        "nombre", "apPaterno", "fechaNacimiento",
        "usuario", "contrasena", "confirmarContrasena",
        "correo", "telefono",
        "direccion", "pais", "estado", "ciudad", "codigoPostal"
    ];
    const campos = idsObligatorios.map(id => document.getElementById(id)).filter(Boolean);
    const terminos = form.querySelector('.actions-card input[type="checkbox"]');
    const avisos = new Map();     // campo -> elemento <small> con el mensaje
    const tocados = new Set();    // campos que el usuario ya visitó
 
    function crearAviso(el, despuesDe) {
        const aviso = document.createElement("small");
        aviso.className = "campo-error";
        aviso.setAttribute("role", "alert");
        aviso.hidden = true;
        despuesDe.insertAdjacentElement("afterend", aviso);
        avisos.set(el, aviso);
        return aviso;
    }
 
    function mensajeDe(el) {
        if (el === terminos) return el.checked ? "" : "Por favor, acepta los términos y condiciones";
        if (el.value.trim() === "") return MENSAJE;
        if (el.type === "email" && !el.checkValidity()) return "Ingresa un correo electrónico válido";
        if (el.id === "confirmarContrasena" && el.value !== document.getElementById("contrasena").value) {
            return "Las contraseñas no coinciden";
        }
        return "";
    }
 
    // Muestra u oculta el aviso del campo. Devuelve true si el campo es inválido.
    function validar(el) {
        const mensaje = mensajeDe(el);
        const aviso = avisos.get(el);
        aviso.textContent = mensaje;
        aviso.hidden = mensaje === "";
        el.classList.toggle("campo-invalido", mensaje !== "");
        el.setAttribute("aria-invalid", mensaje !== "" ? "true" : "false");
        return mensaje !== "";
    }
 
    campos.forEach(el => {
        crearAviso(el, el);
        // Aparece al salir de la casilla vacía; luego se actualiza mientras se escribe
        el.addEventListener("blur", () => { tocados.add(el); validar(el); });
        const revisar = () => { if (tocados.has(el)) validar(el); };
        el.addEventListener("input", revisar);
        el.addEventListener("change", () => { tocados.add(el); validar(el); });
    });
 
    // Si cambia la contraseña, se vuelve a comparar la confirmación
    const contrasena = document.getElementById("contrasena");
    const confirmar = document.getElementById("confirmarContrasena");
    if (contrasena && confirmar) {
        contrasena.addEventListener("input", () => { if (tocados.has(confirmar)) validar(confirmar); });
    }
 
    if (terminos) {
        crearAviso(terminos, terminos.closest("label") || terminos);
        terminos.addEventListener("change", () => { tocados.add(terminos); validar(terminos); });
    }
 
    // Al enviar: se revisan todas las casillas y se detiene el envío si falta alguna
    form.addEventListener("submit", function (e) {
        let primero = null;
        const todos = terminos ? [...campos, terminos] : campos;
        todos.forEach(el => {
            tocados.add(el);
            if (validar(el) && !primero) primero = el;
        });
        if (primero) {
            e.preventDefault();
            primero.scrollIntoView({ behavior: "smooth", block: "center" });
            primero.focus({ preventScroll: true });
        }
    });
 
    // Al limpiar el formulario se quitan todos los avisos
    form.addEventListener("reset", function () {
        tocados.clear();
        avisos.forEach((aviso, el) => {
            aviso.hidden = true;
            aviso.textContent = "";
            el.classList.remove("campo-invalido");
            el.removeAttribute("aria-invalid");
        });
    });
});
 
})();
 