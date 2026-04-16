import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import pool from '../config/db.js';
import CertificatesRepository from '../repositories/certificates.repository.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import { HttpError } from '../utils/errors.js';

const CERTIFICATES_DIR = path.resolve('uploads/certificates');

/**
 * Servicio de generación de certificados PDF.
 */
const CertificatesService = {
  /**
   * Genera el PDF del certificado y lo inserta en la tabla certificates.
   * Debe llamarse dentro de una transacción activa.
   *
   * @param {string} projectId - UUID del proyecto completado
   * @param {import('pg').PoolClient} client - Cliente de transacción activo
   * @returns {Promise<object>} Certificado creado
   * @throws {HttpError} 404 si no se encuentra el assignment del proyecto
   */
  async generate(projectId, client) {
    // Obtener datos del assignment con estudiante, ONG y proyecto en una sola query
    const { rows } = await (client ?? pool).query(
      `SELECT
         a.id            AS assignment_id,
         a.start_date,
         a.end_date,
         u_student.name  AS student_name,
         n.organization_name AS ngo_name,
         p.title         AS project_title
       FROM assignments a
       JOIN users u_student    ON u_student.id = a.student_id
       JOIN projects p         ON p.id = a.project_id
       JOIN ngo_profile n      ON n.user_id = p.ngo_id
       WHERE a.project_id = $1
       ORDER BY a.start_date DESC
       LIMIT 1`,
      [projectId],
    );

    const data = rows[0];
    if (!data) {
      throw new HttpError('No se encontró el assignment del proyecto para generar el certificado', 404);
    }

    // Cerrar el assignment con la fecha de fin
    await AssignmentsRepository.setEndDate(data.assignment_id, client);

    // Actualizar end_date en los datos para incluirla en el PDF
    data.end_date = new Date();

    // Crear directorio si no existe (CA5)
    if (!fs.existsSync(CERTIFICATES_DIR)) {
      fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
    }

    const fileUrl = await CertificatesService._generatePdf(data);
    return CertificatesRepository.create({ assignmentId: data.assignment_id, fileUrl }, client);
  },

  /**
   * Genera el archivo PDF y lo guarda en disco.
   * @param {{ assignment_id: string, student_name: string, ngo_name: string, project_title: string, start_date: Date, end_date: Date }} data
   * @returns {Promise<string>} Ruta relativa del archivo generado
   */
  async _generatePdf(data) {
    return new Promise((resolve, reject) => {
      const certificateId = data.assignment_id;
      const filePath = path.join(CERTIFICATES_DIR, `${certificateId}.pdf`);
      const fileUrl = `uploads/certificates/${certificateId}.pdf`;

      const doc = new PDFDocument({ margin: 60 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Título
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Certificado de Colaboración', { align: 'center' });

      doc.moveDown(2);

      // Cuerpo
      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Se certifica que', { align: 'center' });

      doc.moveDown(0.5);

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(data.student_name, { align: 'center' });

      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text(`ha colaborado con ${data.ngo_name}`, { align: 'center' });

      doc.moveDown(0.5);

      doc
        .text(`en el proyecto "${data.project_title}"`, { align: 'center' });

      doc.moveDown(1);

      // Fechas
      const startDate = data.start_date
        ? new Date(data.start_date).toLocaleDateString('es-ES')
        : '—';
      const endDate = data.end_date
        ? new Date(data.end_date).toLocaleDateString('es-ES')
        : '—';

      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Periodo: ${startDate} — ${endDate}`, { align: 'center' });

      doc.moveDown(2);

      // ID único
      doc
        .fontSize(10)
        .fillColor('#888888')
        .text(`ID de certificado: ${certificateId}`, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(fileUrl));
      stream.on('error', reject);
    });
  },

  /**
   * Devuelve la ruta absoluta del PDF para que el controller lo sirva con res.sendFile().
   * Verifica que el certificado existe y pertenece al estudiante autenticado.
   *
   * @param {string} id - UUID del certificado
   * @param {string} studentId - UUID del estudiante autenticado
   * @returns {Promise<string>} Ruta absoluta del archivo PDF
   * @throws {HttpError} 404 si el certificado no existe en BD
   * @throws {HttpError} 403 si el certificado no pertenece al estudiante
   * @throws {HttpError} 404 si el archivo PDF no existe en disco
   */
  async getFilePath(id, studentId) {
    const certificate = await CertificatesRepository.findById(id);
    if (!certificate) {
      throw new HttpError('Certificado no encontrado', 404);
    }

    if (certificate.student_id !== studentId) {
      throw new HttpError('No tienes permiso para acceder a este certificado', 403);
    }

    const absolutePath = path.resolve(certificate.file_url);
    if (!fs.existsSync(absolutePath)) {
      throw new HttpError('El archivo del certificado no está disponible', 404);
    }

    return absolutePath;
  },
};

export default CertificatesService;
