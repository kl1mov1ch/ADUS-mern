import React from "react"

export const ErrorMessage = ({error = "", message}: { error: string, message?: string }) => {
  return error && <p className="text-red-500 mt-2 mb-5 text-small">{error}</p>
}
