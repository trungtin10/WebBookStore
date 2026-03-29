/**
 * Validation + nút hiển thị mật khẩu cho form đăng nhập / đăng ký (modal + trang riêng).
 */
(function () {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function feedbackEl(field) {
        var wrap = field.closest('.auth-field-wrap');
        if (!wrap) return null;
        return wrap.querySelector('.auth-field-error');
    }

    function setFieldError(field, message) {
        var fb = feedbackEl(field);
        if (fb) {
            fb.textContent = message || '';
            fb.classList.toggle('d-none', !message);
            fb.setAttribute('aria-hidden', message ? 'false' : 'true');
        }
        field.classList.toggle('is-invalid', !!message);
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function clearFormErrors(form) {
        form.querySelectorAll('.is-invalid').forEach(function (el) {
            el.classList.remove('is-invalid');
            el.setAttribute('aria-invalid', 'false');
        });
        form.querySelectorAll('.auth-field-error').forEach(function (el) {
            el.textContent = '';
            el.classList.add('d-none');
            el.setAttribute('aria-hidden', 'true');
        });
    }

    function validatePasswordClient(password) {
        if (!password || password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
        if (!/[A-Z]/.test(password)) return 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa.';
        if (!/[a-z]/.test(password)) return 'Mật khẩu phải chứa ít nhất một chữ cái viết thường.';
        if (!/[0-9]/.test(password)) return 'Mật khẩu phải chứa ít nhất một chữ số.';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt.';
        return '';
    }

    function validateLogin(form) {
        var u = form.querySelector('[name="username"]');
        var p = form.querySelector('[name="password"]');
        var ok = true;
        if (!u) return true;
        if (!u.value.trim()) {
            setFieldError(u, 'Vui lòng nhập tên đăng nhập.');
            ok = false;
        } else setFieldError(u, '');
        if (!p) return ok;
        if (!p.value) {
            setFieldError(p, 'Vui lòng nhập mật khẩu.');
            ok = false;
        } else setFieldError(p, '');
        return ok;
    }

    function validateRegister(form) {
        var ok = true;
        var name = form.querySelector('[name="full_name"]');
        var email = form.querySelector('[name="email"]');
        var user = form.querySelector('[name="username"]');
        var pass = form.querySelector('[name="password"]');

        if (name) {
            if (!name.value.trim()) {
                setFieldError(name, 'Vui lòng nhập họ và tên.');
                ok = false;
            } else setFieldError(name, '');
        }

        if (email) {
            var em = (email.value || '').trim();
            if (!em) {
                setFieldError(email, 'Vui lòng nhập email.');
                ok = false;
            } else if (!EMAIL_RE.test(em)) {
                setFieldError(email, 'Email không đúng định dạng.');
                ok = false;
            } else setFieldError(email, '');
        }

        if (user) {
            var un = (user.value || '').trim();
            if (!un) {
                setFieldError(user, 'Vui lòng nhập tên đăng nhập.');
                ok = false;
            } else if (un.length < 4) {
                setFieldError(user, 'Tên đăng nhập phải dài ít nhất 4 ký tự.');
                ok = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(un)) {
                setFieldError(user, 'Tên đăng nhập chỉ được gồm chữ cái, số hoặc dấu gạch dưới (_).');
                ok = false;
            } else setFieldError(user, '');
        }

        if (pass) {
            var pe = validatePasswordClient(pass.value);
            if (pe) {
                setFieldError(pass, pe);
                ok = false;
            } else setFieldError(pass, '');
        }

        return ok;
    }

    function bindClearOnInput(form) {
        form.querySelectorAll('input').forEach(function (input) {
            input.addEventListener('input', function () {
                setFieldError(input, '');
            });
        });
    }

    function initPasswordToggles(root) {
        (root || document).querySelectorAll('.toggle-password').forEach(function (btn) {
            if (btn.dataset.authToggleBound === '1') return;
            btn.dataset.authToggleBound = '1';
            btn.setAttribute('type', 'button');
            btn.setAttribute('aria-label', 'Hiển thị mật khẩu');
            btn.setAttribute('aria-pressed', 'false');

            btn.addEventListener('click', function () {
                var group = btn.closest('.input-group');
                if (!group) return;
                var input = group.querySelector('input.form-control');
                var icon = btn.querySelector('i');
                if (!input || !icon) return;

                var show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                btn.setAttribute('aria-pressed', show ? 'true' : 'false');
                btn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu');

                icon.classList.remove('fa-eye', 'fa-eye-slash');
                icon.classList.add(show ? 'fa-eye-slash' : 'fa-eye');
            });
        });
    }

    function bindForms(root) {
        (root || document).querySelectorAll('form[data-auth-form="login"]').forEach(function (form) {
            if (form.dataset.authBound === '1') return;
            form.dataset.authBound = '1';
            form.setAttribute('novalidate', '');
            bindClearOnInput(form);
            form.addEventListener('submit', function (e) {
                clearFormErrors(form);
                if (!validateLogin(form)) e.preventDefault();
            });
        });

        (root || document).querySelectorAll('form[data-auth-form="register"]').forEach(function (form) {
            if (form.dataset.authBound === '1') return;
            form.dataset.authBound = '1';
            form.setAttribute('novalidate', '');
            bindClearOnInput(form);
            form.addEventListener('submit', function (e) {
                clearFormErrors(form);
                if (!validateRegister(form)) e.preventDefault();
            });
        });

        initPasswordToggles(root);
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindForms(document);
    });

    window.initAuthForms = bindForms;
})();
