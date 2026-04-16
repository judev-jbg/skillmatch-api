import { describe, it, expect, vi, beforeEach } from 'vitest';
import CertificatesController from '../controllers/certificates.controller.js';
import CertificatesService from '../services/certificates.service.js';

vi.mock('../services/certificates.service.js');

function mockReq({ params = {}, user = { id: 'student-1', role: 'student' } } = {}) {
  return { params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.sendFile = vi.fn().mockReturnValue(res);
  return res;
}

describe('CertificatesController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('download', () => {
    it('llama a res.sendFile con la ruta absoluta del certificado', async () => {
      const absolutePath = '/absolute/path/to/cert-1.pdf';
      CertificatesService.getFilePath.mockResolvedValue(absolutePath);
      const res = mockRes();

      await CertificatesController.download(mockReq({ params: { id: 'cert-1' } }), res);

      expect(res.sendFile).toHaveBeenCalledWith(absolutePath);
    });

    it('delega id y studentId correctamente al service', async () => {
      CertificatesService.getFilePath.mockResolvedValue('/some/path.pdf');
      const res = mockRes();

      await CertificatesController.download(mockReq({ params: { id: 'cert-1' } }), res);

      expect(CertificatesService.getFilePath).toHaveBeenCalledWith('cert-1', 'student-1');
    });
  });
});
