class AuthValidator {
    validatePassword(password) {
        if (!password || password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
        if (!/[A-Z]/.test(password)) return "Mật khẩu phải chứa ít nhất một chữ cái viết hoa.";
        if (!/[a-z]/.test(password)) return "Mật khẩu phải chứa ít nhất một chữ cái viết thường.";
        if (!/[0-9]/.test(password)) return "Mật khẩu phải chứa ít nhất một chữ số.";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt.";
        return null;
    }

    validateRegistration(data) {
        const errors = [];
        if (!data.username || data.username.trim().length < 4) {
            errors.push('Tên đăng nhập phải dài ít nhất 4 ký tự');
        } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            errors.push('Username chỉ cho phép chữ cái, số hoặc dấu _');
        }

        if (!data.email) {
            errors.push('Email không được để trống');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.push('Email không đúng định dạng hợp lệ');
            }
        }

        const passwordError = this.validatePassword(data.password);
        if (passwordError) errors.push(passwordError);

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateLogin(data) {
        const errors = [];
        if (!data.username) errors.push('Vui lòng nhập tên đăng nhập');
        if (!data.password) errors.push('Vui lòng nhập mật khẩu');

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateRegistrationWeb(data) {
        const errors = [];
        if (data.username) {
            if (/\s/.test(data.username)) errors.push('Tên đăng nhập không được chứa khoảng trắng!');
            else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) errors.push('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới (_)!');
            else if (data.username.length > 50) errors.push('Username tối đa 50 ký tự.');
        } else {
            errors.push('Tên đăng nhập không được để trống!');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) errors.push('Email không hợp lệ!');
        else if (data.email && data.email.length > 100) errors.push('Email không được vượt quá 100 ký tự!');

        if (data.full_name && data.full_name.length > 100) errors.push('Họ tên không được vượt quá 100 ký tự!');

        const passwordError = this.validatePassword(data.password);
        if (passwordError) errors.push(passwordError);

        return { isValid: errors.length === 0, errors };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

module.exports = AuthValidator;
