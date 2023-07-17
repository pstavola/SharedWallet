// pages/components/layout.tsx
import React, { ReactNode } from 'react'
import { Text, Center, Container, useColorModeValue } from '@chakra-ui/react'
// @ts-ignore
import Header from './header.tsx'

type Props = {
  children: ReactNode
}

export function Layout(props: Props) {
  return (
    <div>
      <Header />
      <Container maxW="container.md" py='8'>
        {props.children}
      </Container>
      <Center as="footer" bg={useColorModeValue('blue.100', 'blue.700')} p={6}>
          <Text fontSize="md" color='blue'>patricius/2023</Text>
      </Center>
    </div>
  )
}