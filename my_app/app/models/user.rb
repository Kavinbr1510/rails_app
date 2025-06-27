class User < ApplicationRecord
  belongs_to :role
  has_many :products, foreign_key: :seller_id
  has_many :buyer_requests, foreign_key: :buyer_id

  has_secure_password

  validates :name, presence: true,
                   uniqueness: true,
                   format: { with: /\A[a-zA-Z]{3,10}\z/, message: "must be 3-10 alphabetic characters only" }

  validates :email, presence: true,
                    uniqueness: true,
                    format: { with: /\A[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}\z/, message: "must be a valid email in lowercase" }

  validates :password, presence: true, on: :create,
                       length: { minimum: 6 },
                       format: { with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}\z/, message: "must include 1 uppercase, 1 lowercase, 1 digit, 1 special character and be at least 6 characters long" }

  validates :password, length: { minimum: 6 }, allow_nil: true, on: :update,
                       format: { with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}\z/, message: "must include 1 uppercase, 1 lowercase, 1 digit, 1 special character and be at least 6 characters long" }
end