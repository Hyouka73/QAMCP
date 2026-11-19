# QAP-owned host dialog. The input is displayed as text and never evaluated.
$ErrorActionPreference = 'Stop'
trap { exit 1 }

[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
$statement = [Console]::In.ReadToEnd()
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
if ([string]::IsNullOrWhiteSpace($statement) -or
    -not [System.Windows.Forms.SystemInformation]::UserInteractive -or
    [System.Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0) { exit 1 }

[System.Windows.Forms.Application]::EnableVisualStyles()
$script:decision = 'cancelled'

$form = New-Object System.Windows.Forms.Form
$form.Text = 'QAP - Revision humana'
$form.Size = New-Object System.Drawing.Size(820, 610)
$form.MinimumSize = New-Object System.Drawing.Size(640, 420)
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$form.ShowInTaskbar = $true

$layout = New-Object System.Windows.Forms.TableLayoutPanel
$layout.Dock = 'Fill'
$layout.Padding = New-Object System.Windows.Forms.Padding(12)
$layout.ColumnCount = 1
$layout.RowCount = 3
[void]$layout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle('AutoSize')))
[void]$layout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle('Percent', 100)))
[void]$layout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle('AutoSize')))
$form.Controls.Add($layout)

$instruction = New-Object System.Windows.Forms.Label
$instruction.AutoSize = $true
$instruction.Text = 'Revise el contenido y el alcance. Esta decision no autoriza la ejecucion de pruebas.'
$layout.Controls.Add($instruction, 0, 0)

$text = New-Object System.Windows.Forms.TextBox
$text.Multiline = $true
$text.ReadOnly = $true
$text.ScrollBars = 'Vertical'
$text.WordWrap = $true
$text.Dock = 'Fill'
$text.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$text.Text = $statement
$layout.Controls.Add($text, 0, 1)

$buttons = New-Object System.Windows.Forms.FlowLayoutPanel
$buttons.AutoSize = $true
$buttons.Dock = 'Fill'
$layout.Controls.Add($buttons, 0, 2)

foreach ($item in @(
  @{ Label = 'Confirmar'; Decision = 'confirm' },
  @{ Label = 'Rechazar'; Decision = 'reject' },
  @{ Label = 'Aplazar'; Decision = 'defer' },
  @{ Label = 'Cancelar'; Decision = 'cancelled' }
)) {
  $button = New-Object System.Windows.Forms.Button
  $button.Text = $item.Label
  $button.Tag = $item.Decision
  $button.AutoSize = $true
  $button.Add_Click({
    param($sender, $eventArgs)
    $script:decision = [string]$sender.Tag
    $form.Close()
  })
  $buttons.Controls.Add($button)
  if ($item.Decision -eq 'cancelled') { $form.CancelButton = $button }
}

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 120000
$timer.Add_Tick({ $form.Close() })
$form.Add_Shown({
  $form.Activate()
  $text.Focus() | Out-Null
  $text.Select(0, 0)
  $timer.Start()
  [Console]::Error.WriteLine('QAP_REVIEW_SHOWN')
})

try {
  [void]$form.ShowDialog()
  [Console]::Out.WriteLine($script:decision)
} finally {
  $timer.Dispose()
  $form.Dispose()
}
