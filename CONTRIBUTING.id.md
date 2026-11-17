# Pemeliharaan dan Perluasan

Kode publik dan rekomendasi publik berada di dalam paket; platform pribadi, suara, dan referensi kredensial disimpan di luar direktori instalasi. Jangan mengubah pengalaman pribadi menjadi izin default bagi semua orang.

## Pemeriksaan lokal

```sh
python -m pip install requests Pillow
# Perlu juga ffmpeg/ffprobe yang dipasang di sistem; tidak dipasang otomatis saat Skill diaktifkan secara normal
node tests/test_portrait_stage_centers.cjs
python -m unittest discover -s tests -v
```

Uji unit tidak memanggil layanan suara/generasi gambar yang sebenarnya. Untuk verifikasi pada host nyata, lihat [catatan kompatibilitas](references/compatibility.md). Adaptor baru harus menjelaskan dengan tegas: konfigurasi, pemeriksaan, kontrak permintaan dan keluaran, serta perilaku saat gagal; tidak boleh mengklaim kompatibel dengan platform lain hanya dengan mengganti base_url.

## Jembatan alat gambar

Baca [panduan gambar](references/images.md). Host menyediakan deklarasi alat yang sebenarnya, Agent yang memanggil, sedangkan CLI membuat rencana dan memverifikasi hasilnya. Tanda terima bukan autentikasi asal berbasis tanda tangan platform. Kasus gambar yang sudah ada, generasi dinonaktifkan, tanpa alat, biaya tidak diketahui, izin gambar referensi, dan kegagalan generasi semuanya harus tercakup.

Eksekutor API gambar mandiri tetap merupakan perluasan opsional; versi ini tidak memasangnya otomatis, tidak mendaftarkan akun, dan tidak meminjam status login Agent lain.

## Mempertahankan konfigurasi pengguna saat pembaruan

Direktori instalasi boleh diganti; media.json milik pengguna tidak boleh ditulis di dalamnya. Konfigurasi lama mendapatkan bidang baru lewat penggabungan nilai default; kemampuan baru secara default belum dipilih/belum diizinkan, dan suara yang sudah ada tidak dilatih ulang atau direset otomatis. Jika makna suatu bidang berubah, sediakan metode migrasi dan rollback yang eksplisit.

## Pemeriksaan rilis

Setelah meninjau perubahan, stage berkas publik kali ini, lalu hasilkan daftar berkas:

```sh
python scripts/check_release.py manifest --repo .
git add release-manifest.json
python scripts/check_release.py check --repo . --ref INDEX
# Setelah commit, periksa semua commit yang akan dirilis; ganti base dengan baseline remote yang sebenarnya
python scripts/check_release.py check --repo . --ref HEAD --base origin/main
```

Yang diperiksa adalah objek Git, bukan hanya berkas di disk; kredensial yang pernah ditulis di commit perantara lalu dihapus juga ikut diperiksa. Daftar berkas hanya membuktikan bahwa himpunan berkas yang ditinjau konsisten, dan tidak menggantikan tinjauan kode, verifikasi media nyata, maupun pemeriksaan lisensi. Dilarang melewati pemeriksaan atau membangun ulang riwayat untuk menyamarkannya sebagai rilis pertama.

Saat memakai ulang kode, harap pertahankan batas lisensi font, data urutan goresan, dan contoh karakter yang sudah ada. Masukan pribadi disimpan di konfigurasi pribadi; hanya metode dan pengalaman antarmuka yang punya bukti reproduksi yang masuk ke dokumen publik, dengan mencantumkan tanggal, cakupan, dan status verifikasi.
