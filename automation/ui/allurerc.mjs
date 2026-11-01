import { defineConfig } from 'allure';
import { allureConfig } from '../shared/allure-config.mjs';

export default defineConfig(allureConfig('InvenTree UI Tests'));
