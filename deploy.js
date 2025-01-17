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
    include: [
        "assets/**/*",           // Solo los archivos de nuestra app
        "index.html",
        "version.json",
        // Agrega aquí cualquier otro archivo/directorio que necesites subir
    ],
    exclude: [],                 // Ya no necesitamos exclude
    deleteRemote: false,         // Desactivamos el borrado automático
    forcePasv: true
};

console.log('📦 Iniciando deploy a Hostinger...');

ftpDeploy.deploy(config)
    .then(res => console.log("✅ Deploy completado:", res))
    .catch(err => {
        console.error("❌ Error en deploy:", err);
        process.exit(1);
    });