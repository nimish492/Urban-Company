$(document).ready(function () {
  checkAuthStatus();

  const socket = io(); // Establish Socket.IO connection with the server

  // Listen for slot updates from the server
  socket.on("slotUpdated", function (data) {
    const slotButton = $(`button[data-id="${data.slotId}"]`);
    if (slotButton.length) {
      if (data.isAvailable) {
        slotButton
          .removeClass("btn-secondary")
          .addClass("btn-success")
          .text("Book")
          .prop("disabled", false);
      } else {
        slotButton
          .removeClass("btn-success")
          .addClass("btn-secondary")
          .text("Booked")
          .prop("disabled", true);
      }
    }
  });

  // Handle Login Form Submission
  $("#loginForm").submit(async function (e) {
    e.preventDefault();

    const username = $("#username").val();
    const password = $("#password").val();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        location.reload();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  });

  // Handle Logout
  $("#logoutBtn").click(async function () {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("token");
      alert("Logged out successfully");
      location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  });

  // Check Authentication Status
  function checkAuthStatus() {
    const token = localStorage.getItem("token");
    if (!token) {
      $("#bookSlot, #viewReservations, .history").click(function (e) {
        e.preventDefault();
        showLoginModal();
      });
    }
  }

  // Show Bootstrap Login Modal
  function showLoginModal() {
    const loginModal = new bootstrap.Modal($("#loginModal")[0]);
    loginModal.show();
  }

  // Fetch and display carpenters
  function fetchCarpenters() {
    $.ajax({
      url: "/api/carpenters",
      method: "GET",
      success: function (data) {
        const carpenterList = $("#carpenter-list").empty();

        data.forEach((carpenter) => {
          const rating = carpenter.rating || 4;
          const stars = Array.from({ length: 5 }, (_, i) =>
            i < rating ? "★" : "☆"
          ).join("");

          const card = $(`
            <div class="col-md-4 shadow-lg p-3 mb-5 bg-body rounded">
              <div class="card">
                <img src="/assets/${
                  carpenter.image || "default.jpg"
                }" class="card-img-top" alt="Carpenter Image">
                <div class="card-body d-flex flex-column align-items-center justify-content-between">
                  <h5 class="card-title text-center">${carpenter.name}</h5>
                  <p class="card-text text-center">${stars}</p>
                  <p class="card-text text-center"><strong>Experience: </strong>${
                    carpenter.experience
                  }</p>
                  <button class="btn btn-primary view-slots-btn" data-id="${
                    carpenter._id
                  }" data-name="${carpenter.name}">View Slots</button>
                </div>
              </div>
            </div>
          `);
          carpenterList.append(card);
        });

        $(".view-slots-btn").click(function () {
          const carpenterId = $(this).data("id");
          const carpenterName = $(this).data("name");
          $("#slotOffcanvasLabel").text(`Slots for ${carpenterName}`);
          fetchSlots(carpenterId);
        });
      },
      error: function (err) {
        console.error("Error fetching carpenters", err);
      },
    });
  }

  function fetchSlots(carpenterId) {
    if (!localStorage.getItem("token")) {
      showLoginModal();
      return;
    }

    $.ajax({
      url: `/api/slots/${carpenterId}`,
      method: "GET",
      success: function (slots) {
        const slotList = $("#slot-list").empty();
        slots.forEach((slot) => {
          const slotItem = $(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <strong>${slot.startTime} - ${slot.endTime}</strong>
              <button class="btn ${
                slot.isAvailable ? "btn-success" : "btn-secondary"
              } btn-sm book-slot-btn" 
                data-id="${slot._id}" ${!slot.isAvailable ? "disabled" : ""}>
                ${slot.isAvailable ? "Book" : "Booked"}
              </button>
            </li>
          `);
          slotList.append(slotItem);
        });

        $(".book-slot-btn:not([disabled])").click(function () {
          bookSlot($(this).data("id"), $(this));
        });

        new bootstrap.Offcanvas($("#slotOffcanvas")[0]).show();
      },
      error: function (err) {
        console.error("Error fetching slots", err);
      },
    });
  }

  function bookSlot(slotId, button) {
    if (!localStorage.getItem("token")) {
      showLoginModal();
      return;
    }

    $.ajax({
      url: "/api/book",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ slotId }),
      success: function () {
        button
          .removeClass("btn-success")
          .addClass("btn-secondary")
          .text("Booked")
          .prop("disabled", true);
        window.location.href = "/review.html";
      },
      error: function (err) {
        alert("Error booking slot: " + err.responseText);
      },
    });
  }

  if (window.location.pathname === "/review.html") {
    if (!localStorage.getItem("token")) {
      showLoginModal();
      return;
    }

    function fetchReservations() {
      $.ajax({
        url: `/api/reservations`,
        method: "GET",
        success: function (data) {
          const reservationList = $("#reservation-list").empty();

          if (!Array.isArray(data) || data.length === 0) {
            reservationList.append("<p>No reservations found.</p>");
            return;
          }

          data.forEach((reservation) => {
            let statusClass = "pending";
            let statusText = "Confirmation Pending";

            if (reservation.status?.toLowerCase() === "booked") {
              statusClass = "booked";
              statusText = "Booked";
            }

            const carpenter = reservation.carpenterId || {};

            const card = $(`
              <div class="card mb-3 shadow-lg p-3 mb-5 bg-body rounded" style="width: 18rem;">
                <img src="/assets/${
                  carpenter.image || "default.jpg"
                }" class="card-img-top" alt="Carpenter Image">
                <div class="card-body">
                  <h5 class="card-title">${
                    carpenter.name || "Unknown Carpenter"
                  }</h5>
                </div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item"><strong>Email:</strong> ${
                    carpenter.email || "Not Available"
                  }</li>
                  <li class="list-group-item"><strong>Phone:</strong> ${
                    carpenter.phone || "Not Available"
                  }</li>
                  <li class="list-group-item"><strong>Slot:</strong> ${
                    reservation.slotId?.startTime || "N/A"
                  } - ${reservation.slotId?.endTime || "N/A"}</li>
                  <li class="list-group-item"><strong>Status:</strong> <span class="status-${statusClass}">${statusText}</span></li>
                </ul>
                <div class="card-body action-buttons">
                  ${
                    reservation.confirmMessage
                      ? '<p class="thank-you-message text-success">Thank you for choosing me</p>'
                      : `
                    <button class="btn btn-success confirm-btn" data-id="${reservation._id}">Confirm</button>
                    <button class="btn btn-danger cancel-btn" data-id="${reservation._id}">Cancel</button>
                    `
                  }
                </div>
              </div>
            `);
            reservationList.append(card);
          });

          $(".confirm-btn").click(function () {
            confirmReservation($(this).data("id"), $(this));
          });

          $(".cancel-btn").click(function () {
            cancelReservation($(this).data("id"), $(this));
          });
        },
        error: function () {
          alert("Error fetching reservations");
        },
      });
    }

    function confirmReservation(reservationId, button) {
      $.ajax({
        url: "/api/confirm-reservation",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ reservationId }),
        success: function (response) {
          const cardBody = button.closest(".card-body");

          // Remove confirm & cancel buttons
          cardBody.find(".confirm-btn, .cancel-btn").remove();

          // Add thank you message dynamically
          cardBody.append(
            '<p class="thank-you-message text-success">Thank you for choosing me</p>'
          );

          // Update status text and color dynamically
          const statusElement = cardBody
            .closest(".card")
            .find(".status-pending, .status-booked");
          statusElement
            .removeClass("status-pending")
            .addClass("status-booked")
            .text("Booked");
        },
        error: function () {
          alert("Error confirming reservation");
        },
      });
    }

    function cancelReservation(reservationId, button) {
      $.ajax({
        url: "/api/cancel-reservation",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ reservationId }),
        success: function () {
          button.prop("disabled", true).text("Cancelled");
          button.siblings(".confirm-btn").prop("disabled", true);
          fetchReservations();
        },
        error: function () {
          alert("Error cancelling reservation");
        },
      });
    }

    fetchReservations();
  } else {
    fetchCarpenters();
  }
});
