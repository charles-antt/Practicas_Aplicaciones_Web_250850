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