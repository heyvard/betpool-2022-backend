import { allowCors } from '../../cors/corsHelper'
import { ApiHandlerOpts } from '../../types/apiHandlerOpts'
import { auth } from '../../auth/authHandler'

const handler = async function handler(opts: ApiHandlerOpts): Promise<void> {
    const { res, user, client } = opts
    if (!user) {
        res.status(401)
        return
    }

    interface Bet {
        user_id: string
        match_id: string
        game_start: string
    }

    async function getBets(): Promise<Bet[]> {
        return (
            await client.query(`
          SELECT b.user_id,
                 b.match_id,
                 m.game_start,
                 m.away_team,
                 m.home_team,
                 b.home_score,
                 b.away_score,
                 m.round,
                 m.home_score home_result,
                 m.away_score away_result
          FROM bets b,
               matches m,
               users u
          WHERE b.match_id = m.id
            AND game_start < now()
            AND u.id = b.user_id
            AND u.active is true;`)
        ).rows
    }

    interface User {
        id: string
        name: string
        picture: string
    }

    async function getUsers(): Promise<User[]> {
        return (
            await client.query(`
          SELECT u.id, u.name, u.picture
          FROM users u
          WHERE u.active is true`)
        ).rows
    }

    const alt = await Promise.all([getBets(), getUsers()])

    res.json({ bets: alt[0], users: alt[1] })
}

export default allowCors(auth(handler))
