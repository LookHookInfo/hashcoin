import { Flex, Text } from "@mantine/core";
export function PageTitle({ title, subtitle } : { title: string, subtitle?: string}){
   return (<Flex align='center' justify='center' mb={20}>
      <Flex p={10} px={20} align='center' direction='column'>
         <Text fw='bold' size="lg" lh={1.2}>{title}</Text>
         { subtitle && <Text>{subtitle}</Text> }
      </Flex>
   </Flex>)
}