Rails.application.routes.draw do
  root "dashboard#index"

  # Custom authentication routes
  get "sign_up", to: "registrations#new", as: :sign_up
  post "sign_up", to: "registrations#create"
  get "sign_in", to: "sessions#new", as: :sign_in
  post "sign_in", to: "sessions#create"
  delete "sign_out", to: "sessions#destroy", as: :sign_out

  resources :products, only: [ :new, :create, :index ] do
    member do
      patch :approve_by_admin
    end
  end

  resources :buyer_requests, only: [ :create, :index ] do
    member do
      patch :approve_by_seller
    end
  end


  # Dashboards
  get "dashboard", to: "dashboard#index"
  get "dashboard/admin", to: "dashboard#admin"
  get "dashboard/seller", to: "dashboard#seller"
  get "dashboard/buyer", to: "dashboard#buyer"
end
