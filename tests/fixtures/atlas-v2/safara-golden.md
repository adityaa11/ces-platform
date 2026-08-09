# Paket dan Jadwal Keberangkatan

Paket dan Jadwal Keberangkatan creates Pendaftaran Jemaah.

# Data Jemaah

Data Jemaah registers into Pendaftaran Jemaah. Data Jemaah is created, updated, and deactivated.

# Pendaftaran Jemaah

Pendaftaran Jemaah generates Tagihan dan Pembayaran. Pendaftaran Jemaah requires Dokumen Jemaah.

# Tagihan dan Pembayaran

Petugas creates a bill, records a payment, and verifies the payment. Payment status changes from Pending to Verified. Billing status changes from Unpaid to Paid.

# Dokumen Jemaah

Petugas uploads Dokumen Jemaah and verifies the document. Document status changes from Pending to Valid.

# Status Perjalanan dan Kesiapan

Status Perjalanan dan Kesiapan is Ready if payment is Paid and Dokumen Jemaah is Valid; otherwise it is Blocked. Ready qualifies Manifest Keberangkatan.

# Manifest Keberangkatan

Status Perjalanan dan Kesiapan enables Manifest Keberangkatan.

Petugas generates Manifest Keberangkatan after readiness is Ready.

# Dashboard dan Laporan

Dashboard dan Laporan depends on Paket dan Jadwal Keberangkatan, Data Jemaah, Pendaftaran Jemaah, Tagihan dan Pembayaran, Dokumen Jemaah, Status Perjalanan dan Kesiapan, and Manifest Keberangkatan.

# Riwayat Aktivitas

Manifest Keberangkatan activity is recorded in Riwayat Aktivitas.

Riwayat Aktivitas records each user action with its actor and timestamp.
