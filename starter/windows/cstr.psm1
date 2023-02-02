function Write-Colored {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]
        $str,
        [Parameter()]
        [string]
        $color
    )
    if ($color) {
        $originalFColor = $Host.UI.RawUI.ForegroundColor
        # $originalBColor = $Host.UI.RawUI.BackgroundColor
        $Host.UI.RawUI.ForegroundColor = $color
        Write-Output $str
        $Host.UI.RawUI.ForegroundColor = $originalFColor
    } else {
        Write-Output $str
    }
}
    
