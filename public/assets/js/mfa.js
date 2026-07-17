const form = document.getElementById("form");
const inputs = document.querySelectorAll(".otp-field > input");
const button = document.querySelector(".btn");
const otp = document.getElementById("otp");
form.addEventListener("submit", () => {
    const submit = document.getElementById("submit");
    submit.disabled = true;
    submit.innerHTML = `<span class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>Vérification...`
});

window.addEventListener("load", () => inputs[0].focus());
button.setAttribute("disabled", "disabled");
inputs[0].addEventListener("paste", function (event) {
    event.preventDefault();

    const pastedValue = (event.clipboardData || window.clipboardData).getData("text");
    const otpLength = inputs.length;

    for (let i = 0; i < otpLength; i++) {
        if (i < pastedValue.length) {
            inputs[i].value = pastedValue[i];
            inputs[i].removeAttribute("disabled");
            inputs[i].focus;
        } else {
            inputs[i].value = ""; // Clear any remaining inputs
            inputs[i].focus;
        }
    }
});

inputs.forEach((input, index1) => {
    input.addEventListener("keyup", (e) => {
        const currentInput = input;
        const nextInput = input.nextElementSibling;
        const prevInput = input.previousElementSibling;

        if (currentInput.value.length > 1) {
            currentInput.value = "";
            return;
        }

        if (
            nextInput &&
            nextInput.hasAttribute("disabled") &&
            currentInput.value !== ""
        ) {
            nextInput.removeAttribute("disabled");
            nextInput.focus();
        }

        if (e.key === "Backspace") {
            console
            inputs.forEach((input, index2) => {
                if (index1 <= index2 && prevInput) {
                    input.setAttribute("disabled", true);
                    input.value = "";
                    prevInput.focus();
                }
            });
        }

        button.classList.remove("active");
        button.setAttribute("disabled", "disabled");

        const inputsNo = inputs.length;
        if (!inputs[inputsNo - 1].disabled && inputs[inputsNo - 1].value !== "") {
            button.removeAttribute("disabled");
            let value = ""
            inputs.forEach(f => value += f.value)
            otp.value = value;
            return;
        } else if (otp.value != "") {
            otp.value = "";
        }
    });
});

/**
 * 
 * @param {Event} e 
*/
const resendOtp = (e) => {
    const progress = document.getElementById("progress");
    fetch("resendOtp", {
        method: "GET",
        credentials: "include",
    });
    e.target.classList.add("d-none");
    progress.classList.remove("d-none");
    let width = 0
    const interval = setInterval(() => {
        width += 10;
        progress.children[0].style.width = width + "%";
        
        if (width === 100) {
            clearInterval(interval);
            e.target.classList.remove("d-none");
            progress.classList.add("d-none");
            progress.children[0].style.width = 0 + "%";
        }
    }, 1000)
}
document.getElementById("resend").addEventListener("click", resendOtp)