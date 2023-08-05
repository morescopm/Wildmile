import { 
  createStyles, 
  SimpleGrid, 
  Text, 
  Card, 
  Image, 
  Badge,
  Modal
} from '@mantine/core'

export const useStyles = createStyles((theme) => ({

  card: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    ...theme.fn.hover({
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
      cursor:'pointer',
    }),
  },

  title: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
  },

  subtitle: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
  },

}))

export function ImageCardGrid(props) {
  const { classes, theme } = useStyles()
  const { cards, columns } = props

  return (
    <>
      <SimpleGrid mt={40} cols={columns || 2}>
        {cards.map((card) => {
          return (
            <Card key={card.title} withBorder padding="lg" radius="md" className={classes.card}>
              <Card.Section mb="sm">
                <Image src={card.image} alt={card.title} />
              </Card.Section>

              {card.tags.map((tag) => {
                return (
                  <Badge>{tag.name || tag}</Badge>
                )
              })}


              <Text fw={700} className={classes.title} mt="xs">
                {card.title}
              </Text>
              <Text fw={700} className={classes.subtitle} mt="xs">
                {card.subtitle}
              </Text>

              <Text fz="sm" color="dimmed" lineClamp={6}>
                {card.description}
              </Text>
            </Card>
          )
        })}
      </SimpleGrid>
    </>
  )
}

