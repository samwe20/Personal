param([string]$OutputDirectory)
$ErrorActionPreference = 'Continue'
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match 'folio|msedge|webview' } |
  Select-Object Name, ProcessId, ParentProcessId, CommandLine |
  ConvertTo-Json -Depth 3 | Set-Content (Join-Path $OutputDirectory 'processes.json')
Get-Process | Where-Object MainWindowTitle |
  Select-Object Id, ProcessName, MainWindowTitle |
  ConvertTo-Json | Set-Content (Join-Path $OutputDirectory 'windows.json')
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [Windows.Forms.SystemInformation]::VirtualScreen
$bitmap = New-Object Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($bounds.Location, [Drawing.Point]::Empty, $bounds.Size)
  $bitmap.Save((Join-Path $OutputDirectory 'native-screen.png'))
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
