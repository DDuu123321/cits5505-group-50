console.log("main.js is loaded!");
$(document).ready(function () {
  console.log(" jQuery Ready");

  $(document).on('click', '#submitGroup', function () {
    console.log("Create Group button clicked");

    const name = $('#groupName').val().trim();
    const description = $('#groupDesc').val().trim();
    if (!name) return alert("Group name is required");

    $.ajax({
      type: 'POST',
      url: '/group/create',
      contentType: 'application/json',
      data: JSON.stringify({ name, description }),
      success: function (res) {
        if (res.success) {
          const groupId = res.group_id;
          console.log(" Group created:", groupId);

          // Optional: add members if needed
          $('#createGroupModal').modal('hide');
          $('#groupName').val('');
          $('#groupDesc').val('');
          $('#groupMemberList').empty();
        } else {
          alert("Failed to create group");
        }
      },
      error: function (err) {
        console.error("AJAX Error:", err.responseText);
        alert("Error: " + err.responseText);
      }
    });
  });
});

function loadMyReports() {
  $.get('/api/my-reports', function (data) {
    const container = $('#mySharesList');
    container.empty();

    console.log("Received reports:", data);

    if (data.length === 0) {
      container.append('<div class="text-muted">No shared reports yet.</div>');
    } else {
      data.forEach(r => {
        const expires = r.expiry_date ? `Expires on ${r.expiry_date}` : 'No expiration';
        const sharedWith = r.shared_with || '—';

        container.append(`
          <div class="card mb-3 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <h5 class="card-title mb-1">${r.title}</h5>
                <small class="text-muted">${expires}</small>
              </div>
              <p class="card-text">${r.description}</p>
              <p class="text-muted mb-2">Shared with: ${sharedWith}</p>
              <div class="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span class="badge bg-primary me-1">View: 0</span>
                  <span class="badge bg-secondary">Comments: 0</span>
                </div>
                <div>
                  <button class="btn btn-outline-primary btn-sm me-2">✏️ Edit</button>
                  <button class="btn btn-outline-danger btn-sm">🗑️ Delete</button>
                </div>
              </div>
              <small class="text-muted d-block mt-2">Created on ${r.created_at}</small>
            </div>
          </div>
        `);
      });
    }
  });
}

$(document).ready(function () {
  console.log("jQuery is working");

  loadMyReports();

  $('#submitReport').on('click', function () {
    console.log(" Button clicked!");

    const title = $('#reportTitle').val();
    const description = $('#reportDescription').val();
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();
    const expiryDate = $('#expiryDate').val();
    const permission = $('input[name="permissionLevel"]:checked').attr('id');

    const subjects = [];
    $('#createReportModal input[type="checkbox"]:checked').each(function () {
      subjects.push($(this).next('label').text().trim());
    });

    const emails = [];
    $('#createReportModal .badge').each(function () {
      const email = $(this).text().trim().split(' ')[0];
      if (email) emails.push(email);
    });

    const payload = {
      title,
      description,
      startDate,
      endDate,
      expiryDate,
      permission,
      subjects,
      emails
    };

    console.log("📤 Sending:", payload);

    $.ajax({
      type: 'POST',
      url: '/share/create',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (res) {
        console.log(" Report saved:", res);
        if (res.success) {
          $('#createReportModal').modal('hide');
          $('#createReportModal').find('input, textarea').val('');
          $('#createReportModal input[type="checkbox"]').prop('checked', false);
          loadMyReports();
        } else {
          alert('Failed to save report: ' + res.error);
        }
      },
      error: function (xhr) {
        console.error("AJAX error:", xhr.responseText);
        alert('Error: ' + xhr.responseText);
      }
    });
  });
});


function fetchGroupMembers(groupId) {
  $.get(`/group/${groupId}/members`, function (data) {
    const container = $('#emailBadgeContainer'); // wherever you display badges
    container.empty();

    data.forEach(email => {
      container.append(`<span class="badge bg-secondary me-1">${email} <span class="remove-email">×</span></span>`);
    });
  });
}


$('#groupSelect').on('change', function () {
  const groupId = $(this).val();
  if (groupId) {
    fetchGroupMembers(groupId);
  }
});





let newGroupMembers = [];

function loadStudyGroups() {
  $.get('/api/groups', function (groups) {
    const container = $('#groupList');
    container.empty();

    groups.forEach(group => {
      const members = group.members.join(' ');
      container.append(`
        <div class="card mb-3 shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">${group.name}</h5>
            <span class="badge bg-success">${group.members.length} Members</span>
          </div>
          <div class="card-body">
            <p>${group.description}</p>
            <p class="text-muted">${members}</p>
            <button class="btn btn-outline-primary btn-sm me-2"> Group Analytics</button>
            <button class="btn btn-outline-secondary btn-sm"> Manage</button>
          </div>
        </div>
      `);
    });
  });
}

$('#addMemberToGroup').on('click', function () {
  const email = $('#groupMemberEmail').val().trim();
  if (email && !newGroupMembers.includes(email)) {
    newGroupMembers.push(email);
    $('#groupMemberList').append(`<span class="badge bg-info me-1">${email}</span>`);
    $('#groupMemberEmail').val('');
  }
});

$(document).on('click', '#submitGroup', function () {
  console.log(" Create Group button clicked");

  const name = $('#groupName').val().trim();
  const description = $('#groupDesc').val().trim();
  if (!name) return alert("Group name is required");

  $.post('/group/create', JSON.stringify({ name, description }), function (res) {
    if (res.success) {
      const groupId = res.group_id;
      newGroupMembers.forEach(email => {
        $.post(`/group/${groupId}/add-member`, JSON.stringify({ email }));
      });

      $('#createGroupModal').modal('hide');
      $('#groupName').val('');
      $('#groupDesc').val('');
      $('#groupMemberList').empty();
      newGroupMembers = [];
      loadStudyGroups();
    }
  }, 'json');
});

$('a[href="#studyGroups"]').on('shown.bs.tab', function () {
  loadStudyGroups();
});
/*
console.log("main.js is loaded!");

$(document).ready(function () {
  console.log("🟢 jQuery Ready");

  // Attach delegated listener for creating group
  $(document).on('click', '#submitGroup', function () {
    console.log("🟢 Create Group button clicked");

    const name = $('#groupName').val().trim();
    const description = $('#groupDesc').val().trim();
    if (!name) return alert("Group name is required");

    $.ajax({
      type: 'POST',
      url: '/group/create',
      contentType: 'application/json',
      data: JSON.stringify({ name, description }),
      success: function (res) {
        if (res.success) {
          const groupId = res.group_id;
          console.log("✅ Group created:", groupId);
          $('#createGroupModal').modal('hide');
          $('#groupName').val('');
          $('#groupDesc').val('');
          $('#groupMemberList').empty();
          newGroupMembers = [];
          loadStudyGroups();
        } else {
          alert("❌ Failed to create group");
        }
      },
      error: function (err) {
        console.error("❌ AJAX Error:", err.responseText);
        alert("Error: " + err.responseText);
      }
    });
  });

  // Handle create report
  $('#submitReport').on('click', function () {
    console.log("🟢 Submit Report clicked");

    const title = $('#reportTitle').val();
    const description = $('#reportDescription').val();
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();
    const expiryDate = $('#expiryDate').val();
    const permission = $('input[name="permissionLevel"]:checked').attr('id');

    const subjects = [];
    $('#createReportModal input[type="checkbox"]:checked').each(function () {
      subjects.push($(this).next('label').text().trim());
    });

    const emails = [];
    $('#createReportModal .badge').each(function () {
      const email = $(this).text().trim().split(' ')[0];
      if (email) emails.push(email);
    });

    const payload = {
      title,
      description,
      startDate,
      endDate,
      expiryDate,
      permission,
      subjects,
      emails
    };

    console.log("📤 Sending report:", payload);

    $.ajax({
      type: 'POST',
      url: '/share/create',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (res) {
        console.log("✅ Report saved:", res);
        if (res.success) {
          $('#createReportModal').modal('hide');
          $('#createReportModal').find('input, textarea').val('');
          $('#createReportModal input[type="checkbox"]').prop('checked', false);
          loadMyReports();
        } else {
          alert('❌ Failed to save report: ' + res.error);
        }
      },
      error: function (xhr) {
        console.error("❌ AJAX error:", xhr.responseText);
        alert('Error: ' + xhr.responseText);
      }
    });
  });

  // Group dropdown load
  $('#groupSelect').on('change', function () {
    const groupId = $(this).val();
    if (groupId) {
      fetchGroupMembers(groupId);
    }
  });

  // Tab behavior
  $('a[href="#studyGroups"]').on('shown.bs.tab', function () {
    loadStudyGroups();
  });

  // Load reports on initial load
  loadMyReports();
});
*/