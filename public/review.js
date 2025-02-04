function fetchReservations() {
  $.ajax({
    url: `/api/reservations`, // Remove userId from the URL
    method: "GET",
    success: function (data) {
      const reservationList = $("#reservation-list");
      reservationList.empty(); // Clear previous list

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
              <li class="list-group-item"><strong>Status:</strong> 
                <span class="status-${statusClass}">${statusText}</span>
              </li>
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

      // Attach event listeners for confirm and cancel buttons
      $(".confirm-btn").click(function () {
        const reservationId = $(this).data("id");
        confirmReservation(reservationId, $(this));
      });

      $(".cancel-btn").click(function () {
        const reservationId = $(this).data("id");
        cancelReservation(reservationId, $(this));
      });
    },
    error: function () {
      alert("Error fetching reservations");
    },
  });
}
