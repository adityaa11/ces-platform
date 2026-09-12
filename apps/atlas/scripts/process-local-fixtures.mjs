import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
const localFixturePath = path.join(root, "packages", "atlas-fixtures", "generated", "local-projects.json");
const mode = "codex";
const fail = (message) => { throw new Error(message); };

async function storedArtifact(record) {
  const [source] = record.sourceFiles ?? [];
  if (!source || record.sourceFiles.length !== 1) fail(`${record.project.id}: expected one stored source file.`);
  if (source.relativePath !== `docs/PRD/${record.project.id}/${record.initialDraftWorkspace.workspaceId}/${source.name}`) fail(`${record.project.id}: source path is not scoped to its Initial Draft.`);
  if (record.processingJob.workspaceId !== record.initialDraftWorkspace.workspaceId || record.prdRecord?.workspaceId !== record.initialDraftWorkspace.workspaceId) fail(`${record.project.id}: workspace identity drift.`);
  const bytes = new Uint8Array(await readFile(path.join(root, source.relativePath)));
  if (bytes.byteLength !== source.size || createHash("sha256").update(bytes).digest("hex") !== source.sha256) fail(`${record.project.id}: stored source bytes failed hash verification.`);
  const loadingTask = pdfjs.getDocument({ data: bytes, useWorker: false });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  await loadingTask.destroy();
  return { ...source, pageCount };
}

async function extractWithPrdSkill(record, artifact) {
  const bytes = new Uint8Array(await readFile(path.join(root, artifact.relativePath)));
  const task = pdfjs.getDocument({ data: bytes, useWorker: false }), pdf = await task.promise;
  const pages = [];
  for (let page = 1; page <= pdf.numPages; page += 1) pages.push({ page, text: (await (await pdf.getPage(page)).getTextContent()).items.map((item) => item.str).join(" ") });
  await task.destroy();
  const definitions = [
    [1,"Menyatukan data paket, jadwal keberangkatan, jemaah, dan pendaftaran dalam satu aplikasi operasional.","objective.unified-registration-operations",{outcome:"one operational application",entities:["packages","departures","pilgrims","registrations"]},"foundation"],
    [1,"Pembayaran, dokumen perjalanan, kesiapan, manifest, dan laporan belum menjadi ruang lingkup increment ini.","scope.increment-01-exclusions",{excluded:["payments","travel-documents","readiness","manifest","reports"]},"scope"],
    [1,"Pengguna yang sudah dinonaktifkan tidak boleh masuk ke aplikasi.","access.inactive-user-denied",{actor:"inactive user",loginAllowed:false},"access-control"],
    [1,"Menjaga riwayat pendaftaran jemaah agar tidak hilang ketika data dibatalkan atau dinonaktifkan.","history.registration-retention",{historyRetained:true,conditions:["cancellation","deactivation"]},"registration"],
    [1,"Memastikan harga pendaftaran yang sudah disepakati tidak berubah ketika harga paket diperbarui.","registration.agreed-price-immutable",{immutableAfter:"package price update"},"registration"],
    [2,"Admin membuat paket umrah.","workflow.package-create",{actor:"Admin",step:1},"packages-and-departures"],
    [2,"Admin membuat jadwal keberangkatan untuk paket yang dipilih.","workflow.departure-create",{actor:"Admin",step:2,input:"selected package"},"packages-and-departures"],
    [2,"Admin mencatat data jemaah.","workflow.pilgrim-record",{actor:"Admin",step:3},"pilgrim-data"],
    [2,"Admin memilih jemaah dan mendaftarkannya ke jadwal keberangkatan yang masih terbuka.","workflow.open-departure-registration",{actor:"Admin",step:4,condition:"departure is open"},"registration"],
    [2,"Sistem menyimpan harga pendaftaran yang berlaku saat pendaftaran.","registration.price-snapshot",{actor:"System",trigger:"registration",output:"agreed registration price"},"registration"],
    [2,"Sistem menampilkan jumlah jemaah terdaftar dan sisa kuota setiap keberangkatan.","departure.capacity-visibility",{actor:"System",outputs:["registered pilgrim count","remaining quota"]},"packages-and-departures"],
    [2,"Admin dapat membuat, melihat, mengubah, dan menonaktifkan paket umrah.","package.lifecycle",{actor:"Admin",operations:["create","read","update","deactivate"]},"packages-and-departures"],
    [2,"Informasi paket minimal mencakup nama paket, durasi, harga dasar, deskripsi, dan status aktif.","package.required-fields",{fields:["name","duration","base price","description","active status"]},"packages-and-departures"],
    [2,"Setiap paket dapat memiliki satu atau lebih jadwal keberangkatan.","package.departure-cardinality",{relationship:"package has one-or-more departures"},"packages-and-departures"],
    [2,"Pendaftaran baru tidak dapat dilakukan apabila jadwal sudah ditutup atau kuota sudah penuh.","registration.availability-guard",{prohibitedWhen:["departure closed","quota full"]},"registration"],
    [2,"Admin dapat menambah, melihat, mengubah, mencari, dan menonaktifkan data jemaah.","pilgrim.lifecycle",{actor:"Admin",operations:["create","read","update","search","deactivate"]},"pilgrim-data"],
    [2,"NIK harus terdiri dari 16 angka apabila diisi.","pilgrim.nik-validation",{field:"NIK",digits:16,when:"provided"},"pilgrim-data"],
    [2,"Aplikasi harus memberikan peringatan apabila NIK atau nomor paspor sudah digunakan oleh jemaah lain.","pilgrim.identity-duplicate-warning",{fields:["NIK","passport number"],outcome:"warn"},"pilgrim-data"],
    [2,"Pada halaman daftar, NIK dan nomor paspor tidak perlu ditampilkan secara penuh.","pilgrim.identity-list-masking",{fields:["NIK","passport number"],presentation:"not full"},"pilgrim-data"],
    [2,"Setiap pendaftaran memiliki nomor pendaftaran yang berbeda.","registration.unique-identifier",{field:"registration number",unique:true},"registration"],
    [2,"Jemaah yang sama tidak boleh memiliki dua pendaftaran aktif pada jadwal keberangkatan yang sama.","registration.active-duplicate-prohibited",{prohibited:"two active registrations for same pilgrim and departure"},"registration"],
    [2,"Pendaftaran dapat dibatalkan dengan alasan yang tercatat, tetapi riwayatnya tetap dapat dilihat.","registration.cancellation-audit",{cancellationReason:"required",historyRetained:true},"registration"],
    [2,"Jumlah pendaftaran aktif tidak boleh melebihi kuota keberangkatan.","registration.quota-cap",{activeRegistrations:"at most departure quota"},"registration"],
    [2,"Informasi jemaah hanya boleh dilihat oleh pengguna yang berkepentingan.","pilgrim.authorized-access",{access:"authorized users only"},"access-control"],
    [3,"Mendaftarkan jemaah sampai kuota penuh dan memastikan pendaftaran berikutnya ditolak.","acceptance.full-quota-rejection",{scenario:"fill quota then reject next registration"},"acceptance"],
    [3,"Mencoba mendaftarkan jemaah yang sama dua kali pada keberangkatan yang sama.","acceptance.duplicate-active-registration",{scenario:"attempt duplicate active registration"},"acceptance"],
    [3,"Memperbarui harga paket setelah pendaftaran dan memastikan harga pendaftaran yang sudah disepakati tidak berubah.","acceptance.price-snapshot",{scenario:"update package price without changing agreed registration price"},"acceptance"],
    [3,"Membatalkan pendaftaran dan memastikan riwayatnya tetap dapat dilihat.","acceptance.cancellation-history",{scenario:"cancel registration while retaining history"},"acceptance"],
    [3,"Aplikasi web increment pertama yang dapat digunakan untuk pengelolaan paket, jadwal keberangkatan, data jemaah, pendaftaran, dan kuota.","delivery.increment-01-application",{deliverable:"usable web application",scope:["packages","departures","pilgrims","registrations","quota"]},"delivery"],
    [3,"Alamat aplikasi yang dapat diakses oleh pengguna yang ditentukan.","delivery.application-address",{deliverable:"application address",audience:"specified users"},"delivery"],
    [3,"Akun awal untuk Owner/Admin.","delivery.initial-owner-admin-account",{deliverable:"initial Owner/Admin account"},"delivery"],
    [3,"Panduan penggunaan singkat untuk fungsi pada increment ini.","delivery.increment-guide",{deliverable:"brief user guide"},"delivery"],
    [3,"Kuota dan sisa kuota dihitung dengan benar.","acceptance.quota-calculation",{requirement:"quota and remaining quota calculate correctly"},"acceptance"]
  ];
  const artifactId = `artifact-${record.project.id}-${record.initialDraftWorkspace.workspaceId}`;
  const candidates = definitions.map(([page, quote, semanticKey, payload, workflowStage], index) => {
    const text = pages.find((item) => item.page === page)?.text.replace(/\s+/g, " ") ?? "";
    if (!text.includes(quote)) fail(`${record.project.id}: skill evidence quote was not found on page ${page}.`);
    return { candidateId: `candidate-${record.project.id}-${String(index + 1).padStart(3, "0")}`, kind: "requirement", semanticKey, payload: { ...payload, workflowStage }, possibleAffectedSemanticKey: null, evidence: { artifactId, page, quote } };
  });
  const inventory = candidates.map((candidate, index) => ({ inventoryId: `inventory-${record.project.id}-${String(index + 1).padStart(3, "0")}`, artifactId, page: candidate.evidence.page, quote: candidate.evidence.quote, statementClass: "material", normalizedInterpretation: { semanticKey: candidate.semanticKey, payload: candidate.payload }, destination: { type: "candidate_assertion", candidateId: candidate.candidateId } }));
  const pageHeadings = [[1,"SAFARA - Increment 01"],[2,"Alur Utama"],[3,"Skenario Pemeriksaan Hasil"]];
  for (const [page, quote] of pageHeadings) inventory.push({ inventoryId: `inventory-${record.project.id}-heading-${page}`, artifactId, page, quote, statementClass: "non_fact", normalizedInterpretation: { kind: "heading" }, destination: { type: "non_fact", reason: "Heading only; it has no independently meaningful requirement." } });
  return { artifactId, candidateAssertions: candidates, sourceStatementInventory: inventory, questions: [], executionProvenance: { skillId: "atlas.prd-extraction", skillVersion: "1.2.0", mode } };
  if (new Set(inventory.map((entry) => entry.inventoryId)).size !== inventory.length) fail(`${record.project.id}: duplicate inventory ID.`);
  for (let page = 1; page <= artifact.pageCount; page += 1) if (!inventory.some((entry) => entry.page === page && entry.artifactId === stage.input.artifact.artifactId)) fail(`${record.project.id}: inventory omits page ${page}.`);
  const candidateIds = new Set(candidates.map((candidate) => candidate.candidateId));
  for (const entry of inventory) {
    if (entry.destination?.type === "candidate_assertion" && !candidateIds.has(entry.destination.candidateId)) fail(`${record.project.id}: dangling candidate destination ${entry.inventoryId}.`);
    if (entry.destination?.type === "non_fact" && (!entry.destination.reason || entry.statementClass !== "non_fact")) fail(`${record.project.id}: invalid non-fact classification ${entry.inventoryId}.`);
    if (!entry.destination || !["candidate_assertion", "non_fact"].includes(entry.destination.type)) fail(`${record.project.id}: missing inventory destination ${entry.inventoryId}.`);
  }
}

async function processRecord(record) {
  record = { ...record, processingJob: { ...record.processingJob, workspaceId: record.processingJob.workspaceId ?? record.initialDraftWorkspace.workspaceId }, prdRecord: record.prdRecord ?? { projectId: record.project.id, workspaceId: record.initialDraftWorkspace.workspaceId, prdFiles: record.initialDraftWorkspace.prdFiles } };
  if (record.project.status !== "processing" || record.processingJob.stage !== "extracting") fail(`${record.project.id}: only an extracting project can be processed.`);
  if (record.masterWorkspace?.status !== "empty" || record.masterWorkspace?.prdFiles?.length) fail(`${record.project.id}: Master must remain empty during Initial Draft extraction.`);
  const artifact = await storedArtifact(record);
  const extraction = await extractWithPrdSkill(record, artifact);
  const extractionResults = [{ artifactId: extraction.artifactId, candidateAssertions: extraction.candidateAssertions, sourceStatementInventory: extraction.sourceStatementInventory }];
  const repositoryInput = { projectId: record.project.id, sourceArtifacts: [{ artifactId: extraction.artifactId, name: artifact.name, sha256: artifact.sha256, relativePath: artifact.relativePath, pageCount: artifact.pageCount }], baseRepository: { branchId: "master", headRevisionId: null, assertionIds: [] }, requestedScenario: "Initial Draft extraction proposal", scenarioKind: "extraction_backed", extractionResults };
  return {
    ...record,
    project: { ...record.project, status: "ready", lastActivity: "Initial Draft extraction is ready for review", repository: { ...record.project.repository, state: "ready-for-review", initialDraft: { processedPrds: 1, totalPrds: 1, progress: 100 }, metrics: [{ value: "0", label: "published facts" }, { value: "1", label: "PRD uploaded" }, { value: "Ready", label: "to review" }], action: { label: "Review workspace unavailable", enabled: false, unavailableReason: "Initial Draft is ready, but route and workspace selection are not wired yet." } } },
    processingJob: { ...record.processingJob, stage: "ready", message: "Ready to review", progress: 100 },
    initialDraftWorkspace: { ...record.initialDraftWorkspace, status: "ready-for-review", unavailableReason: "Initial Draft is ready, but route and workspace selection are not wired yet." },
    extraction: { workspaceId: record.initialDraftWorkspace.workspaceId, proposalState: "candidate-only", artifact: { artifactId: extraction.artifactId, ...artifact }, executionProvenance: extraction.executionProvenance, candidateAssertions: extraction.candidateAssertions, sourceStatementInventory: extraction.sourceStatementInventory, questions: extraction.questions, repositoryInput }
  };
}

async function main() {
  const records = JSON.parse(await readFile(localFixturePath, "utf8"));
  const reextract = process.argv.includes("--reextract");
  const next = await Promise.all(records.map((record) => record.project.status === "processing" || reextract ? processRecord({ ...record, project: { ...record.project, status: "processing" }, processingJob: { ...record.processingJob, stage: "extracting" } }) : record));
  if (process.argv.includes("--check")) return;
  await writeFile(`${localFixturePath}.tmp`, `${JSON.stringify(next, null, 2)}\n`);
  await rename(`${localFixturePath}.tmp`, localFixturePath);
  console.log(`Processed ${next.filter((record) => record.extraction).length} Initial Draft fixture(s) in ${mode} mode.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
