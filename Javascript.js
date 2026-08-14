// Global State
var rawGaleriData = [];
var isGaleriLoaded = false;
var isAdminLoggedIn = false;

document.addEventListener('DOMContentLoaded', function () {
  // Sidebar Toggle
  var sidebarCollapse = document.getElementById('sidebarCollapse');
  if (sidebarCollapse) {
    sidebarCollapse.addEventListener('click', function () {
      document.getElementById('sidebar').classList.toggle('active');
    });
  }

  // Navigation Click Handler
  var navLinks = document.querySelectorAll('.nav-menu-link');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var targetView = this.getAttribute('data-view');
      switchView(targetView);
    });
  });

  // Set default input date jika ada
  var tglGaleri = document.getElementById('galeriTanggal');
  if (tglGaleri) tglGaleri.value = new Date().toISOString().split('T')[0];
});

function switchView(viewName) {
  var views = document.querySelectorAll('.page-view');
  views.forEach(function (v) { v.classList.add('d-none'); });

  var target = document.getElementById('view-' + viewName);
  if (target) target.classList.remove('d-none');

  var menuItems = document.querySelectorAll('#sidebar ul li');
  menuItems.forEach(function (m) { m.classList.remove('active'); });

  var activeMenu = document.getElementById('menu-' + viewName);
  if (activeMenu) activeMenu.classList.add('active');

  // Trigger modul pemanggilan data
  if (viewName === 'galeri' && !isGaleriLoaded) loadGaleriData();
}

function openAdminLoginModal() {
  var modalEl = document.getElementById('modalAdminLogin');
  if (modalEl && typeof bootstrap !== 'undefined') {
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function submitAdminLogin(e) {
  if (e) e.preventDefault();
  var pwdInput = document.getElementById('adminPasswordInput');
  if (!pwdInput) return;

  google.script.run
    .withSuccessHandler(function (res) {
      if (res && res.success) {
        isAdminLoggedIn = true;
        document.body.classList.add('is-admin');
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Login Admin Berhasil!', timer: 1500, showConfirmButton: false });
        var modalEl = document.getElementById('modalAdminLogin');
        var modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: res ? res.message : 'Password salah!' });
      }
    })
    .checkAdminPassword(pwdInput.value);
}

// ==========================================
// LOGIKA GALERI FOTO
// ==========================================
function getFormattedImageUrl(url) {
  if (!url) return "https://via.placeholder.com/400x200?text=No+Image";
  if (url.indexOf("drive.google.com") !== -1) {
    var match = url.match(/\/d\/([^/=]+)/);
    if (match && match[1]) return "https://lh3.googleusercontent.com/d/" + match[1];
  }
  return url;
}

function loadGaleriData() {
  var container = document.getElementById('galeriGridContainer');
  if (!container) return;

  container.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-spinner fa-spin me-2"></i>Memuat galeri foto...</div>';

  google.script.run
    .withSuccessHandler(function (res) {
      if (!res || !res.success) {
        container.innerHTML = '<div class="col-12 text-center text-danger py-5">' + (res ? res.message : 'Gagal memuat galeri') + '</div>';
        return;
      }
      rawGaleriData = res.list || [];
      isGaleriLoaded = true;
      renderGaleriCards(rawGaleriData);
    })
    .getGaleriData();
}

function renderGaleriCards(dataList) {
  var container = document.getElementById('galeriGridContainer');
  if (!container) return;

  if (!dataList || dataList.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="fa-regular fa-images fa-3x mb-3 d-block"></i>Belum ada foto.</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < dataList.length; i++) {
    var item = dataList[i];
    var imgUrl = getFormattedImageUrl(item.url);

    html += '<div class="col-sm-6 col-md-4 col-lg-3 mb-3" id="galeri-card-' + item.rowIndex + '">' +
      '<div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">' +
        '<div style="height: 160px; overflow: hidden; background-color: #e9ecef;">' +
          '<img src="' + imgUrl + '" loading="lazy" class="w-100 h-100" style="object-fit: cover;">' +
        '</div>' +
        '<div class="card-body p-3">' +
          '<h6 class="fw-bold text-dark text-truncate mb-1">' + item.judul + '</h6>' +
          '<p class="text-muted small mb-2">' + item.deskripsi + '</p>' +
          '<div class="d-flex justify-content-between align-items-center border-top pt-2">' +
            '<span class="text-muted small">' + item.tanggal + '</span>' +
            '<button type="button" class="btn btn-link text-danger p-0 border-0 admin-only" onclick="confirmDeleteGaleri(' + item.rowIndex + ')"><i class="fa-solid fa-trash-can"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  container.innerHTML = html;
}

function confirmDeleteGaleri(rowIndex) {
  if (confirm("Apakah Anda yakin ingin menghapus foto ini?")) {
    google.script.run
      .withSuccessHandler(function () {
        isGaleriLoaded = false;
        loadGaleriData();
      })
      .deleteGaleriData(rowIndex);
  }
}