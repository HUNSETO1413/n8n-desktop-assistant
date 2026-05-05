!macro NSIS_HOOK_PREINSTALL
  ; Kill running n8n Desktop Assistant before installing
  nsExec::ExecToLog 'taskkill /F /IM "n8n Desktop Assistant.exe"'
  Sleep 500
!macroend

!macro NSIS_HOOK_POSTINSTALL
  CreateShortCut "$DESKTOP\n8n Desktop Assistant.lnk" "$INSTDIR\n8n Desktop Assistant.exe"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Kill running app before uninstalling
  nsExec::ExecToLog 'taskkill /F /IM "n8n Desktop Assistant.exe"'
  Sleep 500
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
!macroend
