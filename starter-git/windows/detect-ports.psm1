Import-Module -Name .\starter-git\windows\cstr.psm1

<# 
    .Description
    Get an array of LOCALHOST ports and checkes whether its used. If so, it terminates the program.
#>
 function Get-Port {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [uint16[]]
        $ports
    )

    $free = $true
    foreach ($port in $ports) {
        $query = Get-NetTCPConnection | Where-Object LocalPort -eq $port
        if ($query) {
            Write-Colored "Local port $port in use." "DarkRed"
            $free = $false
        }
    }
    if (!$free) {
        exit 1
    }
}