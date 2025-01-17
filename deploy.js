import FtpDeploy from 'ftp-deploy';
import dotenv from 'dotenv';
dotenv.config();

const ftpDeploy = new FtpDeploy();

const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    host: process.env.FTP_HOST,
    port: 21,
    localRoot: "./dist",
    remoteRoot: "/public_html",
    include: ["*", "**/*"],
    exclude: [
        "dashboard/**",            // Protege todo el directorio dashboard
        "fonts/**",               // Si quieres proteger la carpeta fonts
        ".htaccess",             // Protege el archivo .htaccess
        "default.php"            // Protege default.php
        // "version.json"           // Si necesitas proteger el version.json
    ],
    deleteRemote: true,
    forcePasv: true
};

console.log('📦 Iniciando deploy a Hostinger...');

ftpDeploy.deploy(config)
    .then(res => console.log("✅ Deploy completado:", res))
    .catch(err => {
        console.error("❌ Error en deploy:", err);
        process.exit(1);
    });