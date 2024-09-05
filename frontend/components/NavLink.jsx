import { Link } from 'expo-router'
import { View, Text } from 'react-native'

export default function NavLink({ href, className, children }) {
  return (
    <Link href={href} className={`p-2 rounded-lg color-current ${className}`}> {children} </Link>
  )
}