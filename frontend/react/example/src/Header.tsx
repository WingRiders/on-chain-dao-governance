import {AppBar, Badge, Box, Toolbar, Typography} from '@mui/material'
import {ConnectWalletButton} from './ConnectWalletButton'
import {useIsAdmin} from './helpers/isAdmin'

export const Header = () => {
  const isAdmin = useIsAdmin()

  const titleElement = (
    <Typography variant="h6" component="div">
      On-Chain DAO governance Example
    </Typography>
  )

  return (
    <AppBar position="static">
      <Toolbar>
        <Box flexGrow={1}>
          {isAdmin ? (
            <Badge
              badgeContent={'admin'}
              color="success"
              sx={{
                '& .MuiBadge-badge': {
                  p: 1,
                },
              }}
            >
              {titleElement}
            </Badge>
          ) : (
            titleElement
          )}
        </Box>
        <ConnectWalletButton />
      </Toolbar>
    </AppBar>
  )
}
