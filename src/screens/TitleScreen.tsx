import { useTranslation } from 'react-i18next'
import { setLocale, getLocale, SUPPORTED } from '../i18n'

interface Props {
    onPlay(): void
    onRanking(): void
}

export default function TitleScreen({ onPlay, onRanking }: Props) {
    const { t } = useTranslation()

    const cycleLocale = () => {
        const cur = SUPPORTED.indexOf(getLocale())
        setLocale(SUPPORTED[(cur + 1) % SUPPORTED.length])
    }

    return (
        <div className="screen title-screen">
            <div className="title-ash" aria-hidden="true" />
            <img className="title-key-art" src="/art/title-key.svg" alt="" />
            <div className="title-logo">
                <h1>{t('title.name')}</h1>
                <p className="title-english">{t('title.english')}</p>
                <p className="title-tagline">{t('title.tagline')}</p>
            </div>
            <div className="title-menu">
                <button className="btn btn-primary title-btn" onClick={onPlay}>
                    {t('title.play')}
                </button>
                <button className="btn title-btn" onClick={onRanking}>
                    {t('title.ranking')}
                </button>
                <button className="btn btn-small language-btn" onClick={cycleLocale}>
                    {t('title.language')}
                </button>
            </div>
            <div className="title-version">v{__APP_VERSION__}</div>
        </div>
    )
}
