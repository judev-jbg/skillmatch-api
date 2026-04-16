import CertificatesService from '../services/certificates.service.js';

/**
 * Controlador para la descarga de certificados PDF.
 */
const CertificatesController = {
  /**
   * GET /certificates/:id
   * El estudiante descarga su certificado PDF.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async download(req, res) {
    const filePath = await CertificatesService.getFilePath(req.params.id, req.user.id);
    return res.sendFile(filePath);
  },
};

export default CertificatesController;
