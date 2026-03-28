// Importamos las dependencias necesarias
const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");

const app = express();

// Activamos el middleware que permite recibir archivos desde el cliente
app.use(fileUpload());

// Permite trabajar con JSON en las peticiones
app.use(express.json());

// Permite acceder a los archivos subidos desde el navegador
// Ejemplo: http://localhost:3000/uploads/...
app.use("/uploads", express.static("uploads"));

const PORT = 3000;

/*
Endpoint para subir archivos
Recibe dos archivos:
- cv (curriculum)
- avatar (imagen de perfil)
*/
app.post("/upload/avatar/:userId", (req, res) => {
  const userId = req.params.userId; // Simulación de ID

  // Validamos que existan archivos en la petición
  // req.files es agregado por express-fileupload
  if (!req.files || !req.files.avatar || Object.keys(req.files).length === 0 ) {
    return res.status(400).json({
      ok: false,
      msg: "Debe enviar avatar",
    });
  }

  // Extraemos los archivos de la petición
  const avatar = req.files.avatar;

  // Obtenemos la extensión del archivo usando path.extname()
  // Esto devuelve algo como ".pdf" o ".jpg"
  const extension = avatar.name.split(".").pop().toLowerCase(); // Obtenemos la extensión sin el punto
  // Definimos las extensiones permitidas
  const allowedImg = ["jpg", "jpeg", "png","tiff", "bmp", "gif"];
  
  // Validamos el tipo de archivo de la imagen
  if (!allowedImg.includes(extension)) {
    return res.status(400).json({
      ok: false,
      msg: "Formato de imagen no permitido",
    });
  }

  // Creamos nombres únicos para los archivos
  const avatarName = `${userId}.${extension}`;

  // Definimos las rutas donde se guardarán los archivos
  const avatarPath = `uploads/avatar/${avatarName}`;

  // Eliminamos archivos anteriores del  (si existen)
  deleteIfExists("uploads/avatar/", userId);

  // Guardamos el archivo Avatar usando mv()
  // mv() mueve el archivo desde memoria al sistema de archivos
    avatar.mv(avatarPath, (err) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          msg: "Error al guardar avatar",
        });
      }

      // Respuesta exitosa
      return res.json({
        ok: true,
        msg: "Archivos subidos correctamente",
        data: {
          avatar: userId,
        },
      });
    });
  });

/*
Función para eliminar archivos anteriores de un 
Recorre la carpeta y elimina los archivos cuyo nombre comienza con el userId del 
*/
function deleteIfExists(folder, userId) {
  // Verificamos si la carpeta existe
  if (!fs.existsSync(folder)) return;

  // Leemos todos los archivos dentro de la carpeta
  const files = fs.readdirSync(folder);

  files.forEach((file) => {
    // Si el archivo pertenece al  (ej: "1-...")
    if (file.startsWith(userId.toString())) {
      // Eliminamos el archivo
      fs.unlinkSync(path.join(folder, file));
    }
  });
}

/*
Endpoint para obtener el avatar de un 
Busca el archivo por userId
*/
app.get("/avatar/:userId/", (req, res) => {
  const files = fs.readdirSync("uploads/avatar");

  const file = files.find((f) => f.startsWith(req.params.userId));

  if (!file) {
    return res.status(404).json({
      ok: false,
      msg: "Avatar no encontrado",
    });
  }

  res.sendFile(path.resolve(`uploads/avatar/${file}`));
});

// Levantamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});