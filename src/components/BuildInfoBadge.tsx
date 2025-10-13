import React from 'react'

export default function BuildInfoBadge() {
  return (
    <span
      className="ml-2 inline-block bg-gradient-to-r from-purple-600 to-blue-500
                 text-xs text-white px-2 py-0.5 rounded-full shadow-md 
                 cursor-pointer hover:scale-105 transition-transform"
      title={`Version: ${__VERSION__}\nCommit: ${__COMMIT_HASH__}\nBuilt: ${__BUILD_DATE__}`}
      onClick={() => navigator.clipboard.writeText(__COMMIT_HASH__)}
    >
      v{__VERSION__} • {__COMMIT_HASH__}
    </span>
  )
}
