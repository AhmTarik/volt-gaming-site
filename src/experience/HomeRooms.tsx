import { CineFilm } from "@/experience/CineFilm";
import { HOME_FILM } from "@/experience/scenes";
import { useLang } from "@/i18n";

/** Home-page version of the scroll film (rooms only). Loaded lazily, and only when FLAGS.homeExperience is on. */
const HomeRooms = () => <CineFilm film={HOME_FILM[useLang()]} embedded />;

export default HomeRooms;
