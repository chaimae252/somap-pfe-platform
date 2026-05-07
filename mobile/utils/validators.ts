export const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateLoginPassword = (password: string) => {
    return password.length > 0;
};

export const validateRegisterPassword = (password: string) => {
    return password.length >= 6;
};

// 🔥 NEW: name validation
export const validateName = (name: string) => {
    return name.trim().length >= 2;
};

// 🔥 NEW: phone validation (simple but effective)
export const validatePhone = (phone: string) => {
    return /^[0-9]{8,15}$/.test(phone);
};