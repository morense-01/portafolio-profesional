import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir' }).click();
});

async function addSong(page: any, url = 'https://youtu.be/dQw4w9WgXcQ') {
  await page.getByRole('button', { name: 'Canciones' }).click();
  await page.getByLabel('URL de YouTube').fill(url);
  await page.getByLabel('Título').fill('Demo');
  await page.getByLabel(/Transcripción/).fill('SECRETLYRIC hello world');
  await page.getByRole('button', { name: 'Crear lección' }).click();
}

test('rechaza URL no compatible', async ({ page }) => {
  await addSong(page, 'https://vimeo.com/123');
  await expect(page.getByRole('alert')).toContainText('URL no compatible');
});

test('Listening oculta la letra y Reading exige confirmación', async ({ page }) => {
  await addSong(page);
  await expect(page.getByText('Escucha sin leer')).toBeVisible();
  await expect(page.getByText('SECRETLYRIC')).toHaveCount(0);
  await page.getByRole('button', { name: 'Terminé de escuchar' }).click();
  await expect(page.getByText('¿Estás listo para comenzar la lectura')).toBeVisible();
  await expect(page.getByText('SECRETLYRIC')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sí, empezar Reading' }).click();
  await expect(page.getByText('SECRETLYRIC').first()).toBeVisible();
});

test('la lección se retoma tras recargar', async ({ page }) => {
  await addSong(page);
  await page.getByRole('button', { name: 'Terminé de escuchar' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Retomar' }).click();
  await expect(page.getByText('¿Estás listo para comenzar la lectura')).toBeVisible();
});

test('flujo completo hasta el test; Speaking pendiente sin evidencia', async ({ page }) => {
  await addSong(page);
  await page.getByRole('button', { name: 'Terminé de escuchar' }).click();
  await page.getByRole('button', { name: 'Sí, empezar Reading' }).click();
  await page.getByRole('button', { name: 'Guardar tarjeta' }).first().click();
  await page.getByRole('button', { name: 'Guardar tarjeta' }).nth(1).click();
  await page.getByRole('button', { name: 'Continuar a Writing' }).click();
  await page.getByLabel('Escribe lo que oyes').fill('hello');
  await page.getByRole('button', { name: 'Comparar' }).click();
  await expect(page.getByText(/Precisión/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuar a Speaking' }).click();
  await page.getByRole('button', { name: 'Ir al test final' }).click();
  await page.getByRole('button', { name: 'Calificar' }).click();
  await expect(page.getByText(/pendiente \(sin reconocimiento de voz/)).toBeVisible();
  await expect(page.getByText(/Pendiente de dominio/)).toBeVisible();
});

test('repaso, tutor y exportación de datos', async ({ page }) => {
  await page.getByRole('button', { name: 'Tutor' }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByLabel(/Tu respuesta/).fill('She have a car');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('She has a car')).toBeVisible();
  await page.getByRole('button', { name: 'Ajustes' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar mis datos' }).click()]);
  expect(dl.suggestedFilename()).toBe('lingua-datos.json');
});

test('modo oscuro y navegación por teclado', async ({ page }) => {
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await page.getByLabel('Tema').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await page.keyboard.press('Tab');
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY');
});
