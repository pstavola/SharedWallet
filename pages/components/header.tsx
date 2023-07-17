//pages/components/header.tsx
import React from 'react'
import NextLink from "next/link"
import { Flex, useColorModeValue, Spacer, Heading, LinkBox, LinkOverlay } from '@chakra-ui/react'

const siteTitle="SharedWallet"
export default function Header() {

  return (
    <Flex as='header' bg={useColorModeValue('blue.100', 'blue.900')} p={4} alignItems='center'>
      <Spacer />
      <LinkBox>
        <NextLink href={'/'} passHref>
          <LinkOverlay>
            <Heading size="3xl" color="blue">{siteTitle}</Heading>
          </LinkOverlay>
        </NextLink>
      </LinkBox>
      <Spacer />
    </Flex>
  )
}