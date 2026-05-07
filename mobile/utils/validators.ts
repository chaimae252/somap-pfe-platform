export const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateLoginPassword = (password: string) => {
    return password.length > 0;
};

export const validateRegisterPassword = (password: string) => {
    return password.length >= 6;
};