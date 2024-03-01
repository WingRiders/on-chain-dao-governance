import {AppBar, Badge, Stack, Tab, Tabs, Toolbar, Typography} from '@mui/material'
import {ConnectWalletButton} from '../wallet/ConnectWalletButton'
import {useIsAdmin} from '../../helpers/isAdmin'
import {useLocation, Link as RouterLink} from 'react-router-dom'

export const Header = () => {
  const location = useLocation()

  const isAdmin = useIsAdmin()

  const titleElement = (
    <Typography variant="h6" component="div">
      On-Chain DAO governance Example
    </Typography>
  )

  return (
    <AppBar position="static">
      <Toolbar>
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
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

          <Tabs value={location.pathname} textColor="inherit">
            <MenuItem value="/proposals" label="Proposals" />
            <MenuItem value="/proposals/new" label="Create proposal" />
            <MenuItem value="/paid-fees" label="Paid fees" />
            <MenuItem value="/current-data" label="Current data" />
          </Tabs>

          <ConnectWalletButton />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

type MenuItemProps = {
  value: string
  label: string
}

const MenuItem = ({value, label, ...otherProps}: MenuItemProps) => {
  return (
    <Tab color="inherit" value={value} label={label} component={RouterLink} to={value} {...otherProps} />
  )
}
