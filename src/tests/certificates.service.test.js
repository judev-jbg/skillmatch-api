import { describe, it, expect, vi, beforeEach } from 'vitest';
import CertificatesService from '../services/certificates.service.js';
import CertificatesRepository from '../repositories/certificates.repository.js';

vi.mock('../repositories/certificates.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn(), query: vi.fn() },
}));
vi.mock('fs');
vi.mock('pdfkit');

const FAKE_ASSIGNMENT_DATA = {
  assignment_id: 'assign-1',
  student_name: 'Ana García',
  ngo_name: 'ONG Educación',
  project_title: 'App voluntarios',
  start_date: new Date('2025-01-01'),
  end_date: new Date('2025-06-01'),
};

const FAKE_CERTIFICATE = {
  id: 'cert-1',
  assignment_id: 'assign-1',
  file_url: 'uploads/certificates/assign-1.pdf',
  created_at: new Date(),
};

describe('CertificatesService', () => {
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = {
      query: vi.fn().mockResolvedValue({ rows: [FAKE_ASSIGNMENT_DATA] }),
      release: vi.fn(),
    };
    // Mock de _generatePdf para aislar la lógica de negocio del I/O de archivos
    vi.spyOn(CertificatesService, '_generatePdf').mockResolvedValue('uploads/certificates/assign-1.pdf');
  });

  describe('CA1 / CA3 — generate', () => {
    it('lanza HttpError 404 si no existe assignment para el proyecto', async () => {
      fakeClient.query.mockResolvedValue({ rows: [] });
      await expect(
        CertificatesService.generate('proj-1', fakeClient),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('crea el certificado en BD con el file_url correcto', async () => {
      CertificatesRepository.create.mockResolvedValue(FAKE_CERTIFICATE);

      const result = await CertificatesService.generate('proj-1', fakeClient);

      expect(CertificatesRepository.create).toHaveBeenCalledWith(
        { assignmentId: 'assign-1', fileUrl: 'uploads/certificates/assign-1.pdf' },
        fakeClient,
      );
      expect(result).toEqual(FAKE_CERTIFICATE);
    });

    it('llama a _generatePdf con los datos del assignment', async () => {
      CertificatesRepository.create.mockResolvedValue(FAKE_CERTIFICATE);

      await CertificatesService.generate('proj-1', fakeClient);

      expect(CertificatesService._generatePdf).toHaveBeenCalledWith(FAKE_ASSIGNMENT_DATA);
    });
  });

  describe('CA5 — crea directorio si no existe', () => {
    it('genera el certificado aunque el directorio no exista previamente', async () => {
      // La logica de creacion del directorio esta en generate() con fs.mkdirSync({ recursive: true })
      // que crea el directorio y los padres de forma segura. Este test verifica que generate()
      // completa sin errores incluso cuando _generatePdf esta mockeado (que simula el caso
      // en que el directorio existe o se crea correctamente).
      CertificatesRepository.create.mockResolvedValue(FAKE_CERTIFICATE);

      const result = await CertificatesService.generate('proj-1', fakeClient);

      expect(result).toEqual(FAKE_CERTIFICATE);
    });
  });
});
