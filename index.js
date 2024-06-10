


import express from "express";
import mysql from "mysql";
import fileUpload from 'express-fileupload';
import cors from "cors";
import { run } from './tryGemini.js';
const app = express();
app.use(express.json());
app.use(cors());
app.use(fileUpload());


const dbConfig = {
  host: "http://3.133.139.29/",
  user: "phpmyadmin",
  password: "rosa2022",
  database: "pyramid"
};

let db;

function handleDisconnect() {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.log("Error connecting to DB:", err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect
    } else {
      console.log("Connected to DB");
    }
  });

  db.on('error', (err) => {
    console.log("DB error", err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();
  
app.get('/proveedor', (req, res) => {
    const q = 'SELECT * FROM proveedor';
    db.query(q, (err, data) => {
      if (err) return res.json(err);
      return res.json(data)
    });
  });  

  app.get('/facturas', (req, res) => {

       const q = 'SELECT * FROM facturasregistradas';

    db.query(q, (err, data) => {
      if (err) return res.json(err);
      return res.json(data)
    }); 
  });

  app.put('/actualizarFactura/:id/:estadoAbonado', async (req, res) => {
    const { id, estadoAbonado } = req.params;
  
    const q = 'UPDATE facturasregistradas SET estadoAbonado =? WHERE id =?';
    db.query(q, [estadoAbonado, id], (err, results) => {
        if (err) throw err;
        res.send(results);
        console.log(results)
    });
});


// Función para limpiar y convertir un CUIT a formato numérico

// Ruta para insertar los datos en la tabla facturasregistradas
app.put('/cargarFactura', (req, res) => {
  const datos = req.body;
  const sql = `
  INSERT INTO facturasregistradas (
    numeroFactura, tipoFactura, fechaEmision, fechaVencimiento,
    proveedorEmisor, proveedorCuit, costoTotal, estadoAbonado,
    subtotal, IVAMonto, percepcionIVAMonto, percepcionIIBBMonto,
    IIBBMonto, otrosImpuestos, totalTrasVencimiento
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const valores = [
  datos.codigoFactura, // Asumiendo que datos.codigoFactura es en realidad datos.numeroFactura
  datos.tipoFactura,
  datos.fechaEmision, // Convertir la fecha a objeto Date si no lo está ya
  datos.fechaVencimiento, // Convertir la fecha a objeto Date si no lo está ya
  datos.emisor.nombre,
  datos.emisor.CUIT,
  datos.total,
  0, // Asumiendo que estadoAbonado inicialmente es 0 (no abonado)
  datos.subtotal,
  datos.impuestos.IVAMonto,
  datos.impuestos.percepcionIVAMonto,
  datos.impuestos.percepcionIIBBMonto,
  datos.impuestos.IIBBMonto,
  datos.impuestos.otrosImpuestos,
  datos.totalTrasVencimiento
];

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error('Error al insertar la factura:', err);
      return res.status(500).json({ message: 'Error al insertar la factura', error: err.message });
    }
    const facturaId = result.insertId; // Obtener el ID de la factura insertada
    res.status(200).json({ message: 'Factura insertada correctamente', facturaId: facturaId });  });
});

app.put('/cargarItems', (req, res) => {
  const items = req.body;

  const insertItemQuery = `
    INSERT INTO detallesfacturas (
      id_factura, Codigo, Descripcion, VolumenUnidad, MedicionVolumen,
      UnidadesBulto, PrecioBulto, precioUnidad, Bultos, Bonificacion, importe
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Itera sobre los ítems y ejecuta la inserción en la base de datos para cada uno
  items.forEach(async (item) => {
    const itemValues = [
      item.facturaId,
      item.codigo,
      item.descripcion,
      item.volumenUnidad,
      item.medicionVolumen,
      item.cantUnidadesBulto,
      item.precioBulto,
      (item.precioBulto / item.cantUnidadesBulto),
      item.cantBultosItem,
      item.bonificacion,
      item.importeItem
    ];

    try {
      await db.query(insertItemQuery, itemValues);
    } catch (error) {
      console.error('Error al insertar el ítem:', error);
      return res.status(500).json({ message: 'Error al insertar el ítem', error: error.message });
    }
    
  });

  res.status(200).json({ message: 'Ítems insertados correctamente' });
}); 


  app.get('/facturasNoAbonadas', (req, res) => {
    const currentDate = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
    const q = `
    SELECT *
FROM facturasregistradas
WHERE estadoAbonado = 0 AND DATE_SUB(fechaVencimiento, INTERVAL 10 DAY) < CURDATE();`;
  
    db.query(q, [currentDate], (err, data) => {
      if (err) return res.json(err);
      return res.json(data);
    });
  }); 
  app.get('/facturas/:ano', (req, res) => {

    const ano = req.params.ano;
    const q = `SELECT MONTH(fechaEmision) as mes, 
    SUM(costoTotal) as egresos,
    SUM(IVAMonto) as ivaTotal,
    SUM(PercepcionIvaMonto) as PercepcionIvaTotal,
    SUM(IIBBMonto) as IIBBTotal,
    SUM(PercepcionIIBBMonto) as PercepcionIIBBTotal
FROM facturasregistradas 
WHERE YEAR(fechaEmision) = ${ano} 
GROUP BY MONTH(fechaEmision)`;
    db.query(q, (err, data) => {
      if (err) return res.json(err);

      return res.json(data)

    });
  });

  app.get('/items/:idFactura', (req, res) => {

    const idFactura = req.params.idFactura;
    const q = `SELECT *
FROM detallesfacturas 
WHERE id_factura = ${idFactura}`;
    db.query(q, (err, data) => {
      if (err) return res.json(err);

      return res.json(data)

    });
  });


  // app.get('/intervalos', (req, res) => {
  //   const intervalo = req.query.intervalo; // Obtener el intervalo seleccionado desde la query
  //   let q;
  //   if (intervalo === 'anual') {
  //     q = 'SELECT YEAR(fechaEmision) AS intervalo, SUM(costoTotal) AS egresos, SUM(ingresoTotal) AS ingresos FROM facturasRegistradas INNER JOIN ingresos ON YEAR(fechaEmision) = YEAR(semana) GROUP BY YEAR(fechaEmision)';
  //   } else if (intervalo === 'mensual') {
  //     q = 'SELECT CONCAT(MONTH(fechaEmision), "/", YEAR(fechaEmision)) AS intervalo, SUM(costoTotal) AS egresos, SUM(ingresoTotal) AS ingresos FROM facturasRegistradas INNER JOIN ingresos ON MONTH(fechaEmision) = MONTH(semana) AND YEAR(fechaEmision) = YEAR(semana) GROUP BY MONTH(fechaEmision), YEAR(fechaEmision)';
  //   } else if (intervalo === 'semanal') {
  //     q = 'SELECT CONCAT(WEEK(fechaEmision), "/", YEAR(fechaEmision)) AS intervalo, SUM(costoTotal) AS egresos, SUM(ingresoTotal) AS ingresos FROM facturasRegistradas INNER JOIN ingresos ON WEEK(fechaEmision) = WEEK(semana) AND YEAR(fechaEmision) = YEAR(semana) GROUP BY WEEK(fechaEmision), YEAR(fechaEmision)';
  //   } else {
  //     return res.status(400).json({ error: 'Intervalo no válido' });
  //   }
  //   db.query(q, (err, data) => {
  //     if (err) return res.status(500).json({ error: 'Error en la consulta' });
  //     return res.json(data);
  //   });
  // });

  app.get('/anos', (req, res) => {
    const q = 'SELECT DISTINCT YEAR(fechaEmision) as año FROM facturasregistradas';
    db.query(q, (err, data) => {
      if (err) return res.json(err);
      const anos = data.map(item => item.año);
      return res.json(anos);
    });
  });
  
  // app.listen(3000, () => {
  //   console.log('Servidor escuchando en el puerto 3000');
  // });

  app.put('/proveedor/:cuit', (req, res) => {
    const cuit = req.params.cuit;
    const nombre = req.body.nombre;
    const telefono = req.body.telefono;
    const email = req.body.email;
    const nota = req.body.nota;
    const q = 'UPDATE proveedor SET nombre =?, cuit =?, telefono =?, email =?, nota =? WHERE cuit =?';
    db.query(q, [nombre, cuit, telefono, email, nota, cuit], (err, results) => {
        if (err) throw err;
        res.send(results);
        console.log(results)
    });
});

app.post('/proveedor/creacion', (req, res) => {
    const { nombre, cuit, telefono, email, nota } = req.body;
  
    const q = 'INSERT INTO proveedor SET nombre = ?, cuit = ?, telefono = ?, email = ?, nota = ?';
    db.query(q, [nombre, cuit, telefono, email, nota], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
      } else {
        console.log(results);
        res.status(200).json({ message: 'Proveedor creado exitosamente', data: results });
      }
    });
  });

  app.delete('/proveedor/eliminar/:cuit', (req, res) => {
    const cuit = req.params.cuit;
    console.log(cuit);

    const q = 'DELETE FROM `proveedor` WHERE `proveedor`.`cuit` = ?';
    db.query(q, [cuit], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
      } else {
        console.log(results);
        res.status(200).json({ message: 'Proveedor creado exitosamente', data: results });
      }
    });
  });
 
  app.delete('/facturasDelete/:id', (req, res) => {
    const id = parseInt(req.params.id);
  
    console.log(id);
    const q1 = 'DELETE FROM detallesfacturas WHERE id_factura =?';
    db.query(q1, [id], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ err });
      } else {
        console.log(results);
        const q2 = 'DELETE FROM facturasregistradas WHERE id =?';
        db.query(q2, [id], (err, results) => {
          if (err) {
            console.error(err);
            res.status(500).json({ err });
          } else {
            console.log(results);
            res.status(200).json({ message: 'Factura eliminada correctamente', data: results });
          }
        });
      }
    });
  });



  app.post('/process-invoice', async (req, res) => {
    if (!req.files || !req.files.invoice) {
      return res.status(400).send('No files were uploaded.');
    }
  
    const invoice = req.files.invoice;
    const filePath = `./uploads/${invoice.name}`;
    
    // Save the file
    await invoice.mv(filePath);
  
    try {
      // Call the function from tryGemini.js
      const result = await run(filePath);
      res.json(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

app.listen(8800, ()=>{
  console.log("Connected to backend!");
  })
