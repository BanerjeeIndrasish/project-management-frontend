const formatTime = (date) => {
    if (!date) return "";

    const parsedDate = date instanceof Date
        ? date
        : new Date(date);

    if (isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

function formatDateTime(isoString) {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    // Day
    const day = date.getDate();

    // Month names
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
    ];
    const month = months[date.getMonth()];

    // Year
    const year = date.getFullYear();

    // Hours/minutes with AM/PM
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 → 12
    const paddedMinutes = minutes < 10 ? "0" + minutes : minutes;

    return `${day} ${month} ${year}, ${hours}:${paddedMinutes} ${ampm}`;
}

const getErrorMessage = (error) => {
    const { response } = error;
    const msg = response?.data?.message || response?.data?.error;

    return msg || 'Something went wrong...'
}

export { formatTime, formatDateTime, getErrorMessage }
