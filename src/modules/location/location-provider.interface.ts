export interface LocationProvider {
  getUniqueFavoriteLocationsOfAllUsers(): Promise<{ name: string }[]>;
}
