import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import axios from 'axios';
import fs from "fs";
import path from "path";

dotenv.config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

export async function run(filePath) {
  if (filePath) {
  const fileExtension = path.extname(filePath).substring(1); // Get file extension without the dot

    const systemInstruction = `Eres un asistente encargado de procesar facturas de manera exhaustiva y precisa, sin importar su formato, para extraer y estructurar los datos contenidos en ellas. Recibes archivos de factura en cualquier formato (PDF, imagen, Excel, etc.) y devuelves los datos en formato JSON para su inserción directa en una base de datos de gestión de facturas.

    La estructura del JSON que generarás será la siguiente (los datos utilizados para completar los campos son de ejemplo para que conozcas un poco mas el formato):
    
    {
        "codigoFactura": "12345",
        "tipoFactura": "A",
        "fechaEmision": "2024-05-14",
        "fechaVencimiento": "2024-06-14",
        "emisor": {
          "nombre": "Nombre de la Empresa Emisora",
          "direccion": "Calle de la Empresa Emisora, Ciudad, País",
          "telefono": "1234567890",
          "email": "info@empresaemisora.com",
          "CUIT": "30-68537634-9"
        },
        "receptor": {
          "nombre": "Nombre del Cliente Receptor",
          "direccion": "Calle del Cliente, Ciudad, País",
          "telefono": "0987654321",
          "email": "cliente@example.com",
          "CUIT": "30-68537634-9"
        },
        "items": [
        {
        "codigo": "1245343",
        "descripcion": "Nombre del producto 850gr x 12",
        "cantidadBultos": 2,
        "precioBulto": 1000,
        "importeItem": 2000,
        "bonificacion": 0.00
        }
        ],
        "subtotal": 30200.84,
        "impuestos": {
          "IVA": {
            "tasa": 0.21,
            "monto": 6342.17
          },
          "percepcionIVA": {
            "tasa": 0.03,
            "monto": 906.02
          },
          "perepcionIIBB": {
            "tasa": 0.02,
            "monto": 604.01
          },
          "otrosImpuestos": [
            {
              "nombre": "nombreImpuestoReconocido",
              "tasa": 0.01,
              "monto": 302.00
            },
            {
              "nombre": "nombreImpuestoReconocido2",
              "tasa": 0.01,
              "monto": 302.00
            }
          ]
        },
        "total": 38657.04,
        "totalTrasVencimiento": 42657.04
      }
      
    Algunos clientes pueden requerir una estructura de datos personalizada para los items de la factura. Es por eso que, unicamente al ser indicado el modo "ultra-detallado", los items se deben devolver tal que asi:
    
    {
      "codigo": "1245343",
      "descripcion": "Nombre del producto", 
      "volumenUnidad": 0.85,
      "medicionVolumen": "Kilogramos",
      "cantUnidadesBulto": 12,
      "precioBulto": 1000,
      "precioUnidad": 83.33,
      "cantBultosItem: 2,
      "bonificación": 0.00,
      "importeItem": 2000
    }
    
    siendo; la "descripcion" el nombre de la unidad sin los datos del volumen ni la cantidad de unidades, la "medicionVolumen" unicamente en Kilogramos o Litros adaptando los gramos o mililitros a un numero decimal (850gr => 0.850) si no se indica no colocar, la "cantUnidades" el numero de unidades en un bulto insinuando asi que viene en forma de paquete o caja si no se indica colocar 1 y el "precioUnidad el precio del del bulto dividido la cantidad de unidades.
    Por otro lado, la "bonificacion" es el porcentaje de descuento que se le hace a un item sobre el total, si figura 50% (0.5) significa que el total sera la mitad de lo debido. 
    
    Recuerda que tu objetivo es procesar cualquier tipo de factura, desde facturas de compra hasta recibos de alquiler o de energia (en esos casos siendo la "descripcion" y el "importe" los unicos valores utilizados), y devolver los datos de manera precisa y estructurada según las necesidades del cliente. EN EL CASO DE LA FALTA DE UN DATO DARLE UN VALOR NULL (nulo). En la descripción no incluir mas que el nombre del item. Las fechas deben estar en formato "dd-mm-aaaa" (dia-mes-año)
    En caso de no encontrar los impuestos detallados en la estructura, colocar null y colocar la suma de los impuestos desconocidos en "otrosImpuestos". No debes incluir ningun otro caracter fuera del JSON nada de backticks. 
    `

    const safetySettings = [
        {
          "category": "HARM_CATEGORY_HARASSMENT",
          "threshold": "BLOCK_NONE"
        },
        {
          "category": "HARM_CATEGORY_HATE_SPEECH",
          "threshold": "BLOCK_NONE"
        },
        {
          "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          "threshold": "BLOCK_NONE"
        },
        {
          "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
          "threshold": "BLOCK_NONE"
        },
      ]
      
     const generationConfig = {
        "temperature": 0.9,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
      }
      
      try {
  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest", safetySettings, systemInstruction, generationConfig  });

  const factura1 = fileToGenerativePart("facturasEntrenamiento/factura1.jpg", "image/jpg")
  const factura1Response = `
  {
    "codigoFactura": "2740",
    "tipoFactura": null,
    "fechaEmision": "11-04-2024",
    "fechaVencimiento": null,
    "emisor": {
      "nombre": null,
      "direccion": null,
      "telefono": null,
      "email": null,
      "CUIT": null
    },
    "receptor": {
      "nombre": "CREANDO PAN SA.",
      "direccion": "BOLIVAR 402",
      "telefono": null,
      "email": null,
      "CUIT": "30716027267"
    },
    "items": [
      {
        "codigo": "B4AKU",
        "descripcion": "BOLSA DE PAPEL \"U\"-KRAFT",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 100,
        "precioBulto": 1478.82,
        "precioUnidad": 147.88,
        "cantBultosItem": 10,
        "bonificacion": 0,
        "importeItem": 14788.20
      },
      {
        "codigo": "S1818G",
        "descripcion": "SERVILLETA 18 X 18-PAPEL TISSUE-C",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 1,
        "precioBulto": 5148.47,
        "precioUnidad": 5148.47,
        "cantBultosItem": 2,
        "bonificacion": 0,
        "importeItem": 10296.94
      },
      {
        "codigo": "PH",
        "descripcion": "PAPEL HIGIENICO \"ECO\"",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 8,
        "precioBulto": 7927.35,
        "precioUnidad": 990.92,
        "cantBultosItem": 1,
        "bonificacion": 0,
        "importeItem": 7927.35
      },
      {
        "codigo": "SC",
        "descripcion": "X.ARRANQUE 50 X 70 AD. MAX",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 1,
        "precioBulto": 5542.26,
        "precioUnidad": 5542.26,
        "cantBultosItem": 2,
        "bonificacion": 0,
        "importeItem": 11084.52
      },
      {
        "codigo": "SC",
        "descripcion": "PORTA CINTA 30/60 GRANDE COMUN",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 1,
        "precioBulto": 3581.12,
        "precioUnidad": 3581.12,
        "cantBultosItem": 1,
        "bonificacion": 0,
        "importeItem": 3581.12
      },
      {
        "codigo": "SC",
        "descripcion": "X.CINTA ADHESIVA 24 MM X 40 MTS",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 1,
        "precioBulto": 550.30,
        "precioUnidad": 550.30,
        "cantBultosItem": 4,
        "bonificacion": 0,
        "importeItem": 2201.20
      },
      {
        "codigo": "SC",
        "descripcion": "X.CINTA ADHESIVA 12 MM X 30 MTS",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 1,
        "precioBulto": 522.70,
        "precioUnidad": 522.70,
        "cantBultosItem": 1,
        "bonificacion": 0,
        "importeItem": 522.70
      },
      {
        "codigo": "SC",
        "descripcion": "X.VASO TERMICO",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 25,
        "precioBulto": 1733.57,
        "precioUnidad": 69.34,
        "cantBultosItem": 4,
        "bonificacion": 0,
        "importeItem": 6934.28
      },
      {
        "codigo": "SC",
        "descripcion": "X.VASO TERMICO",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 25,
        "precioBulto": 2237.06,
        "precioUnidad": 89.48,
        "cantBultosItem": 4,
        "bonificacion": 0,
        "importeItem": 8948.24
      },
      {
        "codigo": "SC",
        "descripcion": "X.GUANTES DE NITRILO",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 100,
        "precioBulto": 6929.00,
        "precioUnidad": 69.29,
        "cantBultosItem": 1,
        "bonificacion": 0,
        "importeItem": 6929.00
      }
    ],
    "subtotal": null,
    "impuestos": {
      "IVA": {
        "tasa": null,
        "monto": null
      },
      "percepcionIVA": {
        "tasa": null,
        "monto": null
      },
      "perepcionIIBB": {
        "tasa": null,
        "monto": null
      },
      "IIBB": {
        "tasa": null,
        "monto": null
      },
      "otrosImpuestos": []
    },
    "total": 73213.55,
    "totalTrasVencimiento": 73213.55
  }
  `
  const factura2 = fileToGenerativePart("facturasEntrenamiento/factura2.jpg", "image/jpg")
  const factura2Response = `
  {
    "codigoFactura": "A 0004 00005970",
    "tipoFactura": "A",
    "fechaEmision": "08-03-2024",
    "fechaVencimiento": "18-03-2024",
    "emisor": {
      "nombre": "MONCHIFOOD S.R.L.",
      "direccion": "AV. DEL LIBERTADOR 8520 CABA",
      "telefono": "1121814591",
      "email": null,
      "CUIT": "30716356287"
    },
    "receptor": {
      "nombre": "CREANDO PAN S.A",
      "direccion": "MIGUEL ÁNGEL 5495 VILLA BOSCH",
      "telefono": null,
      "email": null,
      "CUIT": "30716027267"
    },
    "items": [
      {
        "codigo": "007551",
        "descripcion": "LEVADURA DORADA DULCE SECA",
        "volumenUnidad": 0.5,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 3615.70,
        "precioUnidad": 3615.70,
        "cantBultosItem": 20,
        "bonificacion": 0.00,
        "importeItem": 72314.04
      },
      {
        "codigo": "006956",
        "descripcion": "CHANTYPAK UNIDAD",
        "volumenUnidad": 1,
        "medicionVolumen": "Litros",
        "cantUnidadesBulto": 1,
        "precioBulto": 6115.70,
        "precioUnidad": 6115.70,
        "cantBultosItem": 4,
        "bonificacion": 100.00,
        "importeItem": 0.00
      }
    ],
    "subtotal": 72314.04,
    "impuestos": {
      "IVA": {
        "tasa": 0.21,
        "monto": 15185.95
      },
      "percepcionIVA": {
        "tasa": null,
        "monto": 0.00
      },
      "percepcionIIBB": {
        "tasa": null,
        "monto": 0.00
      },
      "otrosImpuestos": []
    },
    "total": 87499.9,
    "totalTrasVencimiento": 87499.9
  }
  `
  const factura3 = fileToGenerativePart("facturasEntrenamiento/factura3.jpg", "image/jpg")
  const factura3Response = 
  `
  {
    "codigoFactura": "1 62114",
    "tipoFactura": null,
    "fechaEmision": "25-03-2024",
    "fechaVencimiento": null,
    "emisor": {
      "nombre": null,
      "direccion": null,
      "telefono": null,
      "email": null,
      "CUIT": null
    },
    "receptor": {
      "nombre": "CREANDO PAN S.A",
      "direccion": "MIGUEL ANGEL 5495 VILLA BOSCH Buenos Aires",
      "telefono": null,
      "email": null,
      "CUIT": "30716027267"
    },
    "items": [
      {
        "codigo": null,
        "descripcion": "MANI CROCANTE C/CHOC SIMOAR",
        "volumenUnidad": 5,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 25375.00,
        "precioUnidad": 25375.00,
        "cantBultosItem": 2,
        "bonificacion": 0,
        "importeItem": 50750.00
      },
      {
        "codigo": null,
        "descripcion": "MAYONESA DANICA",
        "volumenUnidad": 2.9,
        "medicionVolumen": "Litros",
        "cantUnidadesBulto": 1,
        "precioBulto": 5978.00,
        "precioUnidad": 5978.00,
        "cantBultosItem": 8,
        "bonificacion": 0,
        "importeItem": 47824.00
      },
      {
        "codigo": null,
        "descripcion": "CEREZAS ROJAS ENT.CERESKINAS BALDE",
        "volumenUnidad": 3.1,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 27360.00,
        "precioUnidad": 27360.00,
        "cantBultosItem": 4,
        "bonificacion": 0,
        "importeItem": 109440.00
      },
      {
        "codigo": null,
        "descripcion": "HIGOS BALDE NATURALES CERESKINAS",
        "volumenUnidad": 3.1,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 15090.00,
        "precioUnidad": 15090.00,
        "cantBultosItem": 2,
        "bonificacion": 0,
        "importeItem": 30180.00
      },
      {
        "codigo": null,
        "descripcion": "MIEL DON CARLOS",
        "volumenUnidad": 5,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 12375.00,
        "precioUnidad": 12375.00,
        "cantBultosItem": 1,
        "bonificacion": 0,
        "importeItem": 12375.00
      }
    ],
    "subtotal": 250569.00,
    "impuestos": {
      "IVA": {
        "tasa": null,
        "monto": null
      },
      "percepcionIVA": {
        "tasa": null,
        "monto": null
      },
      "percepcionIIBB": {
        "tasa": null,
        "monto": null
      },
      "IIBB": {
        "tasa": null,
        "monto": null
      },
      "otrosImpuestos": []
    },
    "total": 250569.00,
    "totalTrasVencimiento": 250569.00
  }
  `
  const factura4 = fileToGenerativePart("facturasEntrenamiento/factura4.jpg", "image/jpg")
  const factura4Response = `
  {
    "codigoFactura": "8190-16973342",
    "tipoFactura": "A",
    "fechaEmision": "05-12-2023",
    "fechaVencimiento": "15-12-2023",
    "emisor": {
      "nombre": "LOGISTICA LA SERENISIMA S.A.",
      "direccion": "TERESA MASTELLONE 3367 GENERAL RODRIGUEZ BUENOS AIRES",
      "telefono": null,
      "email": null,
      "CUIT": "30707210385"
    },
    "receptor": {
      "nombre": "CREANDO PAN S.A.",
      "direccion": "MIGUEL ANGEL 5495",
      "telefono": null,
      "email": null,
      "CUIT": "30716027267"
    },
    "items": [
      {
        "codigo": "0305-00",
        "descripcion": "LECHE ARMONIA ENTERA 3% SACHET",
        "volumenUnidad": 1,
        "medicionVolumen": "Litros",
        "cantUnidadesBulto": 1,
        "precioBulto": 306.67,
        "precioUnidad": 306.67,
        "cantBultosItem": 34,
        "bonificación": 0,
        "importeItem": 10426.78
      },
      {
        "codigo": "6086-00",
        "descripcion": "QUESO CASANCREM ENTERO SACHET",
        "volumenUnidad": 4,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 14431.67,
        "precioUnidad": 14431.67,
        "cantBultosItem": 2,
        "bonificación": 0.50,
        "importeItem": 14431.67
      }
    ],
    "subtotal": 24858.45,
    "impuestos": {
      "IVA": {
        "tasa": 0.21,
        "monto": 5220.93
      },
      "percepcionIVA": {
        "tasa": 0.03,
        "monto": 745.75
      },
      "percepcionIIBB": {
        "tasa": null,
        "monto": null
      },
      "IIBB": {
        "tasa": null,
        "monto": null
      },
      "otrosImpuestos": 0.00
    },
    "total": 30824.47,
    "totalTrasVencimiento": 30824.47
  }
  
  `
  const factura5 = fileToGenerativePart("facturasEntrenamiento/factura5.jpg", "image/jpg")
  const factura5Response = `
  {
    "codigoFactura": "A00010-00693672",
    "tipoFactura": "A",
    "fechaEmision": "02-04-2024",
    "fechaVencimiento": "09-04-2024",
    "emisor": {
      "nombre": "ALYSER S.A.",
      "direccion": "Dardo Rocha 2324 - (B1640FTF) Martínez Pcia. de Buenos Aires",
      "telefono": "+54 (011) 3220-0154",
      "email": "ventas@alyser.com",
      "CUIT": "30707760237"
    },
    "receptor": {
      "nombre": "CREANDO PAN S.A",
      "direccion": "BOLIVAR 402 1704 - RAMOS MEJIA Buenos Aires",
      "telefono": "4844-2857",
      "email": null,
      "CUIT": "30-71602726-7"
    },
    "items": [
      {
        "codigo": "149832601",
        "descripcion": "TOMATE TRITURADO RIO SALADO",
        "volumenUnidad": 8,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 7714.80,
        "precioUnidad": 7714.80,
        "cantBultosItem": 2,
        "bonificacion": 0.00,
        "importeItem": 15429.60
      },
      {
        "codigo": "372513201",
        "descripcion": "COLORANTE AMARILLO EMETH",
        "volumenUnidad": 2,
        "medicionVolumen": "Litros",
        "cantUnidadesBulto": 1,
        "precioBulto": 4233.60,
        "precioUnidad": 4233.60,
        "cantBultosItem": 1,
        "bonificacion": 0.00,
        "importeItem": 4233.60
      },
      {
        "codigo": "144903405",
        "descripcion": "DURAZNOS CAJA",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 12,
        "precioBulto": 16888.50,
        "precioUnidad": 1407.38,
        "cantBultosItem": 1,
        "bonificacion": 0.00,
        "importeItem": 16888.50
      },
      {
        "codigo": "144915213",
        "descripcion": "ANANA TROZOS MAROLIO",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 12,
        "precioBulto": 53551.80,
        "precioUnidad": 4462.65,
        "cantBultosItem": 1,
        "bonificacion": 0.00,
        "importeItem": 53551.80
      },
      {
        "codigo": "147611203",
        "descripcion": "ATUN AL NATURAL",
        "volumenUnidad": 1,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 13500.00,
        "precioUnidad": 13500.00,
        "cantBultosItem": 16,
        "bonificacion": 0.00,
        "importeItem": 216000.00
      },
      {
        "codigo": "838003601",
        "descripcion": "PULPALIST-C TAXONERA",
        "volumenUnidad": 14,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 32019.30,
        "precioUnidad": 32019.30,
        "cantBultosItem": 2,
        "bonificacion": 0.00,
        "importeItem": 64038.60
      },
      {
        "codigo": "835199902",
        "descripcion": "GELATINA 180 BLOOM",
        "volumenUnidad": 1,
        "medicionVolumen": "Kilogramos",
        "cantUnidadesBulto": 1,
        "precioBulto": 18467.10,
        "precioUnidad": 18467.10,
        "cantBultosItem": 1,
        "bonificacion": 0.00,
        "importeItem": 18467.10
      }
    ],
    "subtotal": 388609.20,
    "impuestos": {
      "IVA": {
        "tasa": 0.21,
        "monto": 81607.93
      },
      "percepcionIVA": {
        "tasa": null,
        "monto": null
      },
      "percepcionIIBB": {
        "tasa": 0.016,
        "monto": 6217.75
      },
      "IIBB": {
        "tasa": null,
        "monto": null
      },
      "otrosImpuestos": []
    },
    "total": 476434.88,
    "totalTrasVencimiento": 476434.88
  }
  `
  const factura6 = fileToGenerativePart("facturasEntrenamiento/factura6.jpeg", "image/jpg")
  const factura6Response = `
  {
    "codigoFactura": 9684,
    "tipoFactura": null,
    "fechaEmision": "25-05-2024",
    "fechaVencimiento": null,
    "emisor": {
      "nombre": "Don Roque",
      "direccion": null,
      "telefono": null,
      "email": null,
      "CUIT": null
    },
    "receptor": {
      "nombre": "Eliana",
      "direccion": "Miguel Angel 5495 (Entre y Quintana ) VILLA BOSCH BUENOS AIRES",
      "telefono": "11-3958-4741",
      "email": null,
      "CUIT": null
    },
    "items": [
      {
        "codigo": "1005006",
        "descripcion": "PROMO REVECA MASAS",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": 5,
        "precioBulto": 212291.00,
        "precioUnidad": 42458.20,
        "cantBultosItem": 1,
        "bonificacion": 0,
        "importeItem": 212291.00
      }
    ],
    "subtotal": 212291.00,
    "impuestos": {
      "IVA": {
        "tasa": null,
        "monto": null
      },
      "percepcionIVA": {
        "tasa": null,
        "monto": null
      },
      "perepcionIIBB": {
        "tasa": null,
        "monto": null
      },
      "IIBB": {
        "tasa": null,
        "monto": null
      },
      "otrosImpuestos": []
    },
    "total": 212291.00,
    "totalTrasVencimiento": 212291.00
  }
  
  `
  const factura7 = fileToGenerativePart("facturasEntrenamiento/factura7.jpg", "image/jpg")
  const factura7Response = `
  {
    "codigoFactura": "0110B17310262",
    "tipoFactura": "C",
    "fechaEmision": "06-04-2024",
    "fechaVencimiento": "06-05-2024",
    "emisor": {
      "nombre": "Aysa",
      "direccion": "Tucuman 752",
      "telefono": 1159845794,
      "email": null,
      "CUIT": "30709565075"
    },
    "receptor": {
      "nombre": "Sra./Sr. ALVAREZ ALICIA",
      "direccion": "JUSTO JUAN BAV 4028 Piso 9 Depto C C1416DU CAPITAL FEDERAL 029",
      "telefono": null,
      "email": null,
      "CUIT": null
    },
    "items": [
      {
        "codigo": null,
        "descripcion": "Cargo Fijo por Servicio",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": null,
        "precioBulto": null,
        "precioUnidad": null,
        "cantBultosItem": null,
        "bonificacion": 0,
        "importeItem": 4842.34
      },
      {
        "codigo": null,
        "descripcion": "Cargo Variable",
        "volumenUnidad": null,
        "medicionVolumen": null,
        "cantUnidadesBulto": null,
        "precioBulto": null,
        "precioUnidad": null,
        "cantBultosItem": null,
        "bonificacion": 0,
        "importeItem": 8258.30
      }
    ],
    "subtotal": 13100.64,
    "impuestos": {
      "IVA": {
        "tasa": 0.21,
        "monto": 2751.13
      },
      "percepcionIVA": {
        "tasa": null,
        "monto": null
      },
      "perepcionIIBB": {
        "tasa": null,
        "monto": null
      },
      "IIBB": {
        "tasa": null,
        "monto": null
      },
      "otrosImpuestos": [
        {
          "nombre": "Financiamiento ERAS",
          "tasa": 0.0104,
          "monto": 136.25
        },
        {
          "nombre": "Financiamiento APLA",
          "tasa": 0.075,
          "monto": 98.25
        }
      ]
    },
    "total": 16086.27,
    "totalTrasVencimiento": 16767.85
  }
  `
  const factura8 = fileToGenerativePart("facturasEntrenamiento/factura8.jpeg", "image/jpeg")
  const factura8Response = `
  {
    "codigoFactura": "2874",
    "tipoFactura": null,
    "fechaEmision": "17-05-2024",
    "fechaVencimiento": null,
    "emisor": {
        "nombre": null,
        "direccion": null,
        "telefono": null,
        "email": null,
        "CUIT": null
    },
    "receptor": {
        "nombre": "CREANDO PAN SA.",
        "direccion": "BOLIVAR 402",
        "telefono": null,
        "email": null,
        "CUIT": "30716027267"
    },
    "items": [
        {
            "codigo": "B4050C",
            "descripcion": "CAMISETA 40 X 50 AD. - CHIANG",
            "volumenUnidad": null,
            "medicionVolumen": null,
            "cantUnidadesBulto": 100,
            "precioBulto": 1501.76,
            "precioUnidad": 15.01,
            "cantBultosItem": 20,
            "bonificacion": 0,
            "importeItem": 30035.2
        },
        {
            "codigo": "PH",
            "descripcion": "PAPEL HIGIENICO \"ECO\"",
            "volumenUnidad": null,
            "medicionVolumen": null,
            "cantUnidadesBulto": 8,
            "precioBulto": 7927.35,
            "precioUnidad": 990.92,
            "cantBultosItem": 1,
            "bonificacion": 0,
            "importeItem": 7927.35
        },
        {
            "codigo": "SC",
            "descripcion": "X.CINTA ADHESIVA 24 MM X 40 MTS",
            "volumenUnidad": null,
            "medicionVolumen": null,
            "cantUnidadesBulto": 1,
            "precioBulto": 550,
            "precioUnidad": 550,
            "cantBultosItem": 5,
            "bonificacion": 0,
            "importeItem": 2750
        }
    ],
    "subtotal": null,
    "impuestos": {
        "IVA": {
            "tasa": null,
            "monto": null
        },
        "percepcionIVA": {
            "tasa": null,
            "monto": null
        },
        "perepcionIIBB": {
            "tasa": null,
            "monto": null
        },
        "IIBB": {
            "tasa": null,
            "monto": null
        },
        "otrosImpuestos": []
    },
    "total": 40712.55,
    "totalTrasVencimiento": 40712.55
}`;

const factura9 = fileToGenerativePart("facturasEntrenamiento/factura9.jpeg", "image/jpeg")
const factura9Response = `
{
  "codigoFactura": "000300000907X",
  "tipoFactura": null,
  "fechaEmision": "16-05-2024",
  "fechaVencimiento": null,
  "emisor": {
      "nombre": "MARTIN CORONADO",
      "direccion": null,
      "telefono": "112010049",
      "email": null,
      "CUIT": null
  },
  "receptor": {
      "nombre": "CONFITERIA LA ROSA",
      "direccion": "MIGUEL ANGEL 5495 VILLA BOSCH",
      "telefono": null,
      "email": null,
      "CUIT": null
  },
  "items": [
      {
          "codigo": null,
          "descripcion": "COCA COLA Sabor Original",
          "volumenUnidad": 0.5,
          "medicionVolumen": "Litros",
          "cantUnidadesBulto": 1,
          "precioBulto": 44500,
          "precioUnidad": 44500,
          "cantBultosItem": 2,
          "bonificacion": 0,
          "importeItem": 89000
      },
      {
          "codigo": null,
          "descripcion": "COCA COLA zero",
          "volumenUnidad": 0.5,
          "medicionVolumen": "Litros",
          "cantUnidadesBulto": 1,
          "precioBulto": 44500,
          "precioUnidad": 44500,
          "cantBultosItem": 2,
          "bonificacion": 0,
          "importeItem": 89000
      },
      {
          "codigo": null,
          "descripcion": "FANTA",
          "volumenUnidad": 0.6,
          "medicionVolumen": "Litros",
          "cantUnidadesBulto": 1,
          "precioBulto": 24400,
          "precioUnidad": 24400,
          "cantBultosItem": 2,
          "bonificacion": 0,
          "importeItem": 48800
      },
      {
          "codigo": null,
          "descripcion": "BAGGIO FRESH MANZANA",
          "volumenUnidad": 0.6,
          "medicionVolumen": "Litros",
          "cantUnidadesBulto": 1,
          "precioBulto": 5770.01,
          "precioUnidad": 5770.01,
          "cantBultosItem": 1,
          "bonificacion": 0,
          "importeItem": 5770.01
      },
      {
          "codigo": null,
          "descripcion": "BAGGIO FRESH NARANJA",
          "volumenUnidad": 0.6,
          "medicionVolumen": "Litros",
          "cantUnidadesBulto": 1,
          "precioBulto": 5770.01,
          "precioUnidad": 5770.01,
          "cantBultosItem": 1,
          "bonificacion": 0,
          "importeItem": 5770.01
      },
      {
          "codigo": null,
          "descripcion": "BAGGIO FRESH POMELO",
          "volumenUnidad": 0.6,
          "medicionVolumen": "Litros",
          "cantUnidadesBulto": 1,
          "precioBulto": 5770.01,
          "precioUnidad": 5770.01,
          "cantBultosItem": 1,
          "bonificacion": 0,
          "importeItem": 5770.01
      },
      {
        "codigo": null,
        "descripcion": "BAGGIO Pronto -Manzana",
        "volumenUnidad": 0.2,
        "medicionVolumen": Litros,
        "cantUnidadesBulto": 18,
        "precioBulto": 5770.01,
        "precioUnidad": 320.56,
        "cantBultosItem": 1,
        "bonificacion": 0,
        "importeItem": 5770.01
      },
      {
          "codigo": null,
          "descripcion": "BAGGIO Pronto -Multifruta-",
          "volumenUnidad": 0.2,
          "medicionVolumen": Litros,
          "cantUnidadesBulto": 18,
          "precioBulto": 5770.01,
          "precioUnidad": 320.56,
          "cantBultosItem": 1,
          "bonificacion": 0,
          "importeItem": 5770.01
      },
      {
          "codigo": null,
          "descripcion": "BAGGIO Pronto -Naranja-",
          "volumenUnidad": 0.2,
          "medicionVolumen": Litros,
          "cantUnidadesBulto": 18,
          "precioBulto": 5770.01,
          "precioUnidad": 320.56,
          "cantBultosItem": 1,
          "bonificacion": 0,
          "importeItem": 5770.01
      }
  ],
  "subtotal": null,
  "impuestos": {
      "IVA": {
          "tasa": null,
          "monto": null
      },
      "percepcionIVA": {
          "tasa": null,
          "monto": null
      },
      "perepcionIIBB": {
          "tasa": null,
          "monto": null
      },
      "IIBB": {
          "tasa": null,
          "monto": null
      },
      "otrosImpuestos": []
  },
  "total": 514330.03,
  "totalTrasVencimiento": 514330.03
}
`;
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura1],
      },
      {
        role: "model",
        parts: [{ text: factura1Response }],
      },
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura2],
      },
      {
        role: "model",
        parts: [{ text: factura2Response}],
      },
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura3],
      },
      {
        role: "model",
        parts: [{ text: factura3Response }],
      },
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura4],
      },
      {
        role: "model",
        parts: [{ text: factura4Response }],
      },
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura5],
      },
      {
        role: "model",
        parts: [{ text: factura5Response }],
      },
       {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura6],
      },
      {
        role: "model",
        parts: [{ text: factura6Response }],
      },
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura7],
      },
      {
        role: "model",
        parts: [{ text: factura7Response }],
      },
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura8],
      },
      {
        role: "model",
        parts: [{ text: factura8Response }],
      },
      {
        role: "user",
        parts: [{ text: "modo ultra-detallado"}, factura9],
      },
      {
        role: "model",
        parts: [{ text: factura9Response }],
      }
    ]
  });

  const imagenUsuario = fileToGenerativePart(filePath, `image/${fileExtension}`)

  // const history = await chat.getHistory();
  // const msgContent = { role: "user", parts: [{ text: "modo ultra-detallado" }, imagenUsuario] };
  // const contents = [...history, systemInstruction  ,msgContent];
  // const { totalTokens } = await model.countTokens({ systemInstruction });

  const result = await chat.sendMessage(["modo ultra-detallado", imagenUsuario]);
  const response = await result.response;
  const text = response.text();
  let jsonData = null;
  // Check if text starts with "An error occurred"
  if (text.startsWith("An error occurred")) {
      console.error("Error occurred:", text);
      // Handle the error appropriately, maybe by throwing an exception or returning an error object
  } else {
      // Assuming the response is JSON, parse it
      try {
          jsonData = JSON.parse(text);
          return jsonData;
          // Now you can work with the jsonData object
      } catch (error) {
          console.error("Error parsing JSON:", error);
          return ("Error parsing JSON:", error);
          // Handle the parsing error appropriately
      }
  }


} catch (error) {
    console.error("An error occurred:", error);
  }
fs.unlinkSync(filePath); 

}
}

run();