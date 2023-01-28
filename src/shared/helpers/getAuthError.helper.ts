export const getAuthError = (error: string): string => {
  switch (error) {
    case "auth/wrong-password": {
      return "Wrong password.";
    }
    case "auth/email-already-in-use": {
      return "Email already in use.";
    }
    case "auth/invalid-email": {
      return "Invalid email.";
    }
    case "auth/user-not-found": {
      return "User not found.";
    }
    case "auth/user-disabled": {
      return "User disabled.";
    }
    case "auth/popup-blocked": {
      return "Popup blocked.";
    }
    case "auth/popup-closed-by-user": {
      return "Popup closed by user.";
    }
    case "auth/network-request-failed": {
      return "Network request failed.";
    }
    default: {
      return "Something went wrong...";
    }
  }
};
