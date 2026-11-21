package vault

import "context"

func ptr[T any](value T) *T { return &value }

func (s *Store) Seed(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var count int
	if err := tx.QueryRowContext(ctx, "SELECT count(*) FROM challenges").Scan(&count); err != nil || count != 0 {
		return err
	}
	for _, fields := range []Fields{
		{
			Title:       "Smart Apartment",
			Description: ptr("Сделать мониторинг энергопотребления квартиры в реальном времени и попробовать понять, на чём можно экономить."),
			Spark:       ptr("Впервые начал самостоятельно платить ЖКХ, увидел большую сумму и захотел понять, куда конкретно уходят деньги."),
			Category:    ptr("Home"), Tags: []string{"home", "hardware", "measurement", "optimization"},
			EstimatedDuration: ptr(360), RequiresLeavingHome: ptr(false), RequiresMoney: ptr(true),
		},
		{
			Title:       "Photo Archive Experiment",
			Description: ptr("Попробовать прогнать свой фотоархив через локальную vision-модель и посмотреть, что она сможет в нём найти."),
			Category:    ptr("AI"), Tags: []string{"photography", "AI", "experiment"},
			EstimatedDuration: ptr(240), RequiresLeavingHome: ptr(false), RequiresMoney: ptr(false),
		},
		{
			Title:       "Love You to Death",
			Description: ptr("Сыграть басовую партию Type O Negative — Love You to Death от начала до конца."),
			Spark:       ptr("Песня вызывает сильные эмоции, и захотелось самому её сыграть."),
			Category:    ptr("Music"), Tags: []string{"music", "bass"},
			EstimatedDuration: ptr(60), RequiresLeavingHome: ptr(false), RequiresMoney: ptr(false),
		},
		{
			Title: "Home Server Dashboard", Description: ptr("Сделать красивый dashboard состояния домашнего Raspberry Pi сервера."),
			Category: ptr("Self-hosting"), Tags: []string{"raspberry", "self-hosting", "hardware"},
			EstimatedDuration: ptr(120), RequiresLeavingHome: ptr(false), RequiresMoney: ptr(false),
		},
	} {
		c, err := newChallenge(fields, s.currentTime())
		if err != nil {
			return err
		}
		if err := save(ctx, tx, c); err != nil {
			return err
		}
	}
	return tx.Commit()
}
