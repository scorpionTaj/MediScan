// Check if the browser supports notifications
export function checkNotificationPermission(): string {
  if (!("Notification" in window)) {
    return "unsupported"
  }
  return Notification.permission
}

// Request permission for notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

// Send a notification
export function sendNotification(title: string, options: NotificationOptions = {}): boolean {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false
  }

  // Set default icon if not provided
  if (!options.icon) {
    options.icon = "/favicon.ico"
  }

  // Create and show the notification
  const notification = new Notification(title, options)

  // Optional: Handle notification events
  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  return true
}

// Send a report notification
export function sendReportNotification(patientName: string, diagnosis: string): boolean {
  const title = `MediScan Report: ${patientName}`
  const options = {
    body: `Diagnosis: ${diagnosis}\nReport is ready for review.`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `report-${Date.now()}`,
    requireInteraction: true,
  }

  return sendNotification(title, options)
}
