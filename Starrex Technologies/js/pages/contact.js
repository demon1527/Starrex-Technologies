/* Contact page form behaviour. Delivery is handled by FormSubmit; no server code is required. */
export function initContactForm() {
  const form = document.querySelector("#contact-form-element");
  if (!form) return;

  const status = document.querySelector("#contact-form-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector(".submit-label");
  const fields = [...form.querySelectorAll("input[required], select[required], textarea[required]")];

  function setFieldError(field, message = "") {
    const error = form.querySelector(`[data-error-for="${field.id}"]`);
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
  }

  function validateField(field) {
    let message = "";
    if (!field.value.trim()) {
      message = "Please complete this field.";
    } else if (field.type === "email" && !field.validity.valid) {
      message = "Enter a valid email address.";
    } else if (field.minLength > 0 && field.value.trim().length < field.minLength) {
      message = field.name === "message"
        ? "Please add a little more detail (at least 15 characters)."
        : `Please enter at least ${field.minLength} characters.`;
    }
    setFieldError(field, message);
    return !message;
  }

  fields.forEach(field => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
    field.addEventListener("change", () => validateField(field));
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      status.textContent = "Please check the highlighted fields and try again.";
      status.classList.add("is-error");
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    if (form.querySelector('[name="_honey"]').value) return;

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitLabel.textContent = "Sending…";

    try {
      const response = await fetch("https://formsubmit.co/ajax/ehtishamofficial28@gmail.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        throw new Error("The form service returned an unexpected response.");
      }

      if (!response.ok || result.success !== "true" && result.success !== true) {
        throw new Error(result.message || "The message could not be sent right now.");
      }

      form.reset();
      fields.forEach(field => setFieldError(field));
      status.textContent = "Thanks for reaching out! Your message has been submitted. We'll get back to you by email.";
      status.classList.add("is-success");
    } catch (error) {
      console.error("Starrex contact form:", error);
      status.textContent = "We couldn't send your message. Please try again, or email us directly at ehtishamofficial28@gmail.com.";
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitLabel.textContent = "Send Message";
    }
  });
}
