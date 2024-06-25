const logger = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    const logMessage = `🐧 Simpu [${timestamp}] [${level.toUpperCase()}]: ${message}`;
    
    switch (level) {
        case 'warn':
            console.warn(logMessage);
            break;
        case 'error':
            console.error(logMessage);
            break;
        default:
            console.log(logMessage);
            break;
    }
};

export default logger;
