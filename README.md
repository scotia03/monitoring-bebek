# Monit Bebek

Dashboard monitoring kandang bebek berbasis web statis yang bisa langsung dibuka di browser tanpa instalasi dependency.

## Fitur

- Monitoring suhu, kelembapan, amonia, air minum, stok pakan, dan cahaya.
- Alert otomatis dengan rekomendasi tindakan.
- Mode `Otomatis` dan `Manual` untuk perangkat kandang.
- Manajemen batch telur, inkubasi, fase lockdown, menetas, dan brooder bibit.
- Kontrol perangkat inkubator seperti pemanas, pemutar telur, humidifier, dan lampu brooder.
- Riwayat pembacaan sensor terakhir.
- Checklist operator kandang.
- Penyimpanan lokal memakai `localStorage`.

## Cara Menjalankan

1. Buka file `index.html` langsung di browser.
2. Gunakan tombol `Simulasikan Data Baru` untuk melihat perubahan sensor.
3. Ubah nilai sensor lewat form input untuk mencoba kondisi tertentu.
4. Gunakan tombol `Majukan 1 Hari` untuk mensimulasikan progres inkubasi sampai bibit.
5. Ubah data batch telur dan bibit pada form siklus produksi.
6. Pindah ke mode manual bila ingin menyalakan atau mematikan perangkat satu per satu.

## Struktur File

- `index.html` : struktur dashboard.
- `styles.css` : tampilan dan layout responsif.
- `app.js` : logika monitoring, alert, histori, dan interaksi.

## Pengembangan Lanjutan

- Hubungkan sensor nyata seperti DHT22, MQ-135, flow sensor, atau water level sensor lewat ESP32.
- Kirim data ke backend/API untuk monitoring multi-kandang.
- Tambahkan autentikasi operator dan notifikasi WhatsApp/Telegram.
